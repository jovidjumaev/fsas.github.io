const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const QRCodeGenerator = require('./qr-code-generator.js');
require('dotenv').config({ path: '.env.local' });

const router = express.Router();

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================================
// SESSION TEMPLATE GENERATION
// =====================================================

// Generate session templates for a class instance
const generateSessionTemplates = async (classInstanceId) => {
  try {
    console.log('🔄 Generating session templates for class instance:', classInstanceId);
    
    // Get class instance details
    const { data: classInstance, error: instanceError } = await supabase
      .from('class_instances')
      .select(`
        *,
        courses(code, name),
        academic_periods(name, start_date, end_date)
      `)
      .eq('id', classInstanceId)
      .single();
    
    if (instanceError || !classInstance) {
      throw new Error('Class instance not found');
    }
    
    // Use existing schedule information from class instance
    const daysOfWeek = classInstance.days_of_week || [];
    const startTime = classInstance.start_time;
    const endTime = classInstance.end_time;
    
    // Get academic period dates
    const periodStart = new Date(classInstance.first_class_date);
    const periodEnd = new Date(classInstance.last_class_date);
    
    // Generate sessions for each day in the period
    const sessions = [];
    let sessionNumber = 1;
    let currentDate = new Date(periodStart);
    
    while (currentDate <= periodEnd) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (daysOfWeek.includes(dayName)) {
        sessions.push({
          class_instance_id: classInstanceId,
          session_number: sessionNumber++,
          date: currentDate.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          room_location: classInstance.room_location,
          status: 'scheduled',
          is_active: false,
          total_enrolled: 0,
          attendance_count: 0
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Insert sessions into database
    if (sessions.length > 0) {
      const { data: insertedSessions, error: insertError } = await supabase
        .from('class_sessions')
        .insert(sessions)
        .select();
      
      if (insertError) throw insertError;
      
      console.log(`✅ Generated ${sessions.length} session templates`);
      return insertedSessions;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error generating session templates:', error);
    throw error;
  }
};

// =====================================================
// QR CODE ROTATION SYSTEM
// =====================================================

// Generate rotating QR codes using standardized generator
const generateQRCode = (sessionId) => {
  return QRCodeGenerator.generateRotatingQR(sessionId);
};

// =====================================================
// SESSION MANAGEMENT ENDPOINTS
// =====================================================

// Get professor's sessions (all classes)
router.get('/api/professors/:professorId/sessions', async (req, res) => {
  try {
    const { professorId } = req.params;
    const { status, class_id, date_range } = req.query;
    
    console.log('📊 Fetching sessions for professor:', professorId);
    
    let query = supabase
      .from('class_sessions')
      .select(`
        *,
        class_instances!inner(
          id,
          room_location,
          days_of_week,
          start_time,
          end_time,
          courses(code, name),
          academic_periods(name)
        )
      `)
      .eq('class_instances.professor_id', professorId);
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (class_id && class_id !== 'all') {
      query = query.eq('class_instance_id', class_id);
    }
    
    if (date_range && date_range !== 'all') {
      const today = new Date();
      const startDate = new Date(today);
      
      switch (date_range) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(today.getMonth() - 1);
          break;
      }
      
      query = query.gte('date', startDate.toISOString().split('T')[0]);
    }
    
    const { data: sessions, error } = await query
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    
    // Get current enrollment and attendance counts for each session
    const sessionsWithCounts = await Promise.all(sessions.map(async (session) => {
      // Get enrollment count from class_instances table for consistency
      const { data: classInstance } = await supabase
        .from('class_instances')
        .select('current_enrollment')
        .eq('id', session.class_instances.id)
        .single();
      
      // Get attendance count for this session
      const { data: attendanceRecords } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', session.id);
      
      return {
        ...session,
        total_enrolled: classInstance ? classInstance.current_enrollment : 0,
        attendance_count: attendanceRecords ? attendanceRecords.length : 0
      };
    }));
    
    res.json({
      success: true,
      sessions: sessionsWithCounts,
      count: sessionsWithCounts.length
    });
  } catch (error) {
    console.error('❌ Error fetching professor sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get sessions for specific class instance
router.get('/api/class-instances/:instanceId/sessions', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { status } = req.query;
    
    let query = supabase
      .from('class_sessions')
      .select('*')
      .eq('class_instance_id', instanceId);
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data: sessions, error } = await query
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    
    res.json({
      success: true,
      sessions,
      count: sessions.length
    });
  } catch (error) {
    console.error('❌ Error fetching class sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Activate session (start attendance)
router.post('/api/sessions/:sessionId/activate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes } = req.body;
    
    console.log('🚀 Activating session:', sessionId);
    
    // Check if session exists and is scheduled
    const { data: session, error: fetchError } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('status', 'scheduled')
      .single();
    
    if (fetchError || !session) {
      return res.status(400).json({
        success: false,
        error: 'Session not found or already activated'
      });
    }
    
    // Generate initial QR code
    const qrData = await QRCodeGenerator.generateSecureQR(sessionId);
    
    // Calculate session end time (1 hour from now)
    const endTime = new Date(Date.now() + 60 * 60 * 1000);
    
    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('class_sessions')
      .update({
        status: 'active',
        is_active: true,
        qr_secret: qrData.secret,
        qr_expires_at: qrData.expires_at,
        notes: notes || null,
        activated_at: new Date().toISOString() // Track when session was activated
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Start QR code rotation
    startQRCodeRotation(sessionId);
    
    // Set automatic timeout after 1 hour
    setTimeout(async () => {
      try {
        console.log('⏰ Auto-completing session after 1 hour:', sessionId);
        await completeSessionAutomatically(sessionId);
      } catch (error) {
        console.error('❌ Error auto-completing session:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
    
    // Notify students (implement notification system)
    await notifyStudentsSessionActivated(sessionId);
    
    // Emit WebSocket event for real-time updates
    if (global.io) {
      global.io.emit('session_status_update', {
        sessionId: sessionId,
        status: 'active'
      });
      global.io.emit('session_activated', {
        sessionId: sessionId
      });
      console.log('📡 Emitted session activation events via WebSocket');
    }
    
    console.log('✅ Session activated successfully:', sessionId);
    
    res.json({
      success: true,
      session: updatedSession,
      qr_code: qrData
    });
  } catch (error) {
    console.error('❌ Error activating session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Complete session automatically (for timeout)
async function completeSessionAutomatically(sessionId) {
  try {
    console.log('⏰ Auto-completing session:', sessionId);
    
    // Check if session is still active
    const { data: session, error: fetchError } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('status', 'active')
      .single();
    
    if (fetchError || !session) {
      console.log('Session not found or already completed:', sessionId);
      return;
    }
    
    // Stop QR code rotation
    stopQRCodeRotation(sessionId);
    
    // Update session
    const { error: updateError } = await supabase
      .from('class_sessions')
      .update({
        status: 'completed',
        is_active: false,
        qr_expires_at: null
      })
      .eq('id', sessionId);
    
    if (updateError) throw updateError;
    
    // Emit WebSocket event for real-time updates
    if (global.io) {
      global.io.emit('session_status_update', {
        sessionId: sessionId,
        status: 'completed'
      });
      global.io.emit('session_completed', {
        sessionId: sessionId
      });
      console.log('📡 Emitted auto-completion events via WebSocket');
    }
    
    console.log('✅ Session auto-completed successfully:', sessionId);
  } catch (error) {
    console.error('❌ Error auto-completing session:', error);
    throw error;
  }
}

// Complete session (end attendance)
router.post('/api/sessions/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log('🏁 Completing session:', sessionId);
    
    // Stop QR code rotation
    stopQRCodeRotation(sessionId);
    
    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('class_sessions')
      .update({
        status: 'completed',
        is_active: false,
        qr_expires_at: null
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    console.log('✅ Session completed successfully:', sessionId);
    
    // Emit WebSocket event for real-time updates
    if (global.io) {
      global.io.emit('session_status_update', {
        sessionId: sessionId,
        status: 'completed'
      });
      global.io.emit('session_completed', {
        sessionId: sessionId
      });
      console.log('📡 Emitted session completion events via WebSocket');
    }
    
    res.json({
      success: true,
      session: updatedSession
    });
  } catch (error) {
    console.error('❌ Error completing session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Pause session (temporarily stop attendance)
router.post('/api/sessions/:sessionId/pause', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log('⏸️ Pausing session:', sessionId);
    
    // Check if session exists and is active
    const { data: session, error: fetchError } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('status', 'active')
      .single();
    
    if (fetchError || !session) {
      return res.status(400).json({
        success: false,
        error: 'Session not found or not active'
      });
    }
    
    // Stop QR code rotation
    stopQRCodeRotation(sessionId);
    
    // Update session to paused state
    const { data: updatedSession, error: updateError } = await supabase
      .from('class_sessions')
      .update({
        status: 'paused',
        is_active: false,
        qr_expires_at: null
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    console.log('✅ Session paused successfully:', sessionId);
    
    res.json({
      success: true,
      session: updatedSession,
      message: 'Session paused successfully'
    });
  } catch (error) {
    console.error('❌ Error pausing session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resume session (restart attendance from paused state)
router.post('/api/sessions/:sessionId/resume', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log('▶️ Resuming session:', sessionId);
    
    // Check if session exists and is paused
    const { data: session, error: fetchError } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('status', 'paused')
      .single();
    
    if (fetchError || !session) {
      return res.status(400).json({
        success: false,
        error: 'Session not found or not paused'
      });
    }
    
    // Generate new QR code
    const qrData = await QRCodeGenerator.generateSecureQR(sessionId);
    
    // Update session to active state
    const { data: updatedSession, error: updateError } = await supabase
      .from('class_sessions')
      .update({
        status: 'active',
        is_active: true,
        qr_secret: qrData.secret,
        qr_expires_at: qrData.expires_at
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Start QR code rotation
    startQRCodeRotation(sessionId);
    
    console.log('✅ Session resumed successfully:', sessionId);
    
    res.json({
      success: true,
      session: updatedSession,
      message: 'Session resumed successfully'
    });
  } catch (error) {
    console.error('❌ Error resuming session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel session
router.post('/api/sessions/:sessionId/cancel', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes } = req.body;
    
    console.log('❌ Cancelling session:', sessionId);
    
    // Stop QR code rotation if active
    stopQRCodeRotation(sessionId);
    
    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('class_sessions')
      .update({
        status: 'cancelled',
        is_active: false,
        qr_expires_at: null,
        notes: notes || null
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    console.log('✅ Session cancelled successfully:', sessionId);
    
    res.json({
      success: true,
      session: updatedSession
    });
  } catch (error) {
    console.error('❌ Error cancelling session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get session details
router.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const { data: session, error } = await supabase
      .from('class_sessions')
      .select(`
        *,
        class_instances!inner(
          id,
          room_location,
          courses(code, name),
          academic_periods(name)
        )
      `)
      .eq('id', sessionId)
      .single();
    
    if (error) throw error;
    
    // Get current enrollment count from class_instances table for consistency
    const { data: classInstance, error: classError } = await supabase
      .from('class_instances')
      .select('current_enrollment')
      .eq('id', session.class_instances.id)
      .single();
    
    if (classError) {
      console.error('❌ Error fetching class instance enrollment count:', classError);
    }
    
    // Get current attendance count for this session
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', sessionId);
    
    if (attendanceError) {
      console.error('❌ Error fetching attendance count:', attendanceError);
    }
    
    // Update session with current counts
    const updatedSession = {
      ...session,
      total_enrolled: classInstance ? classInstance.current_enrollment : 0,
      attendance_count: attendanceRecords ? attendanceRecords.length : 0
    };
    
    res.json({
      success: true,
      session: updatedSession
    });
  } catch (error) {
    console.error('❌ Error fetching session details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get attendance records for a session
router.get('/api/sessions/:sessionId/attendance', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const { data: attendance, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        students!inner(
          user_id,
          student_id,
          users(first_name, last_name, email)
        )
      `)
      .eq('session_id', sessionId)
      .order('scanned_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      attendance
    });
  } catch (error) {
    console.error('❌ Error fetching attendance records:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current QR code for active session
router.get('/api/sessions/:sessionId/qr-code', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log('📱 Fetching QR code for session:', sessionId);
    
    // Check if session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('status', 'active')
      .single();
    
    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or not active'
      });
    }
    
    // Generate current QR code
    const qrData = await QRCodeGenerator.generateSecureQR(sessionId);
    
    res.json({
      success: true,
      qr_code: qrData.qr_code,
      expires_at: qrData.expires_at,
      session_id: sessionId,
      time_remaining: Math.max(0, Math.floor((new Date(qrData.expires_at).getTime() - Date.now()) / 1000))
    });
  } catch (error) {
    console.error('❌ Error fetching QR code:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get QR code for active session (legacy endpoint)
router.get('/api/sessions/:sessionId/qr-code-legacy', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const { data: session, error } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('status', 'active')
      .single();
    
    if (error || !session) {
      return res.status(404).json({
        success: false,
        error: 'Active session not found'
      });
    }
    
    // Generate current QR code
    const qrData = generateQRCode(sessionId);
    
    res.json({
      success: true,
      qr_code: qrData,
      session: session
    });
  } catch (error) {
    console.error('❌ Error getting QR code:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// QR CODE ROTATION MANAGEMENT
// =====================================================

const activeRotations = new Map();

const startQRCodeRotation = (sessionId) => {
  console.log('🔄 Starting QR code rotation for session:', sessionId);
  
  const rotationInterval = setInterval(async () => {
    try {
      const qrData = await QRCodeGenerator.generateSecureQR(sessionId);
      
      await supabase
        .from('class_sessions')
        .update({
          qr_secret: qrData.secret,
          qr_expires_at: qrData.expires_at
        })
        .eq('id', sessionId);
      
      console.log('🔄 QR code rotated for session:', sessionId);
      
      // Emit real-time QR code update
      if (global.io) {
        global.io.to(`session-${sessionId}`).emit('qr_code_update', {
          sessionId,
          qr_code: qrData.qr_code,
          expires_at: qrData.expires_at,
          time_remaining: Math.max(0, Math.floor((new Date(qrData.expires_at).getTime() - Date.now()) / 1000))
        });
        
        console.log('📡 Real-time QR code update emitted to session room');
      }
    } catch (error) {
      console.error('❌ Error rotating QR code:', error);
    }
  }, 30000); // 30 seconds
  
  activeRotations.set(sessionId, rotationInterval);
};

const stopQRCodeRotation = (sessionId) => {
  console.log('⏹️ Stopping QR code rotation for session:', sessionId);
  
  const interval = activeRotations.get(sessionId);
  if (interval) {
    clearInterval(interval);
    activeRotations.delete(sessionId);
  }
};

// =====================================================
// NOTIFICATION SYSTEM
// =====================================================

const notifyStudentsSessionActivated = async (sessionId) => {
  try {
    console.log('📢 Notifying students about session activation:', sessionId);
    
    // Get enrolled students for this session's class
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        students!inner(
          user_id,
          users!inner(email, first_name, last_name)
        )
      `)
      .eq('class_id', (await supabase
        .from('class_sessions')
        .select('class_instance_id')
        .eq('id', sessionId)
        .single()
      ).data.class_instance_id);
    
    if (enrollmentError) throw enrollmentError;
    
    // Create notifications for each student
    const notifications = enrollments.map(enrollment => ({
      user_id: enrollment.students.user_id,
      type: 'session_activated',
      title: 'Class Session Started',
      message: 'Your professor has started a new class session. Check in now!',
      data: { session_id: sessionId },
      is_read: false
    }));
    
    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);
      
      if (notificationError) throw notificationError;
      
      console.log(`📢 Sent notifications to ${notifications.length} students`);
    }
  } catch (error) {
    console.error('❌ Error notifying students:', error);
  }
};

// =====================================================
// EXPORT FUNCTIONS
// =====================================================

module.exports = {
  router,
  generateSessionTemplates,
  generateQRCode,
  startQRCodeRotation,
  stopQRCodeRotation
};
