const Settings = require("../models/Settings");

function handleSequelizeError(res, error) {
  // Validation error
  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  // Fallback
  console.error(error);
  return res.status(500).json({ message: "Server error" });
}

// @desc    Get system settings (creates default if not exists)
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    // Settings is a singleton - get first or create
    let settings = await Settings.findOne();

    if (!settings) {
      // Create default settings if none exist
      settings = await Settings.create({
        institution_name: 'Institution Name',
        institution_address: '',
        contact_number: '',
        email_address: '',
        academic_year: '2024-2025',
        email_notifications_enabled: true,
        sms_notifications_enabled: true,
        payment_reminders_enabled: false,
        late_fee_alerts_enabled: false
      });
    }

    res.json(settings);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (Admin only)
exports.updateSettings = async (req, res) => {
  try {
    const {
      institution_name,
      institution_address,
      contact_number,
      email_address,
      academic_year,
      email_notifications_enabled,
      sms_notifications_enabled,
      payment_reminders_enabled,
      late_fee_alerts_enabled
    } = req.body;

    // Get existing settings or create new
    let settings = await Settings.findOne();

    if (!settings) {
      // Create new settings
      settings = await Settings.create(req.body);
    } else {
      // Update existing settings
      await settings.update({
        institution_name,
        institution_address,
        contact_number,
        email_address,
        academic_year,
        email_notifications_enabled,
        sms_notifications_enabled,
        payment_reminders_enabled,
        late_fee_alerts_enabled
      });
    }

    res.json(settings);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};
