const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const { generateToken, successResponse, errorResponse } = require("../utils/response");
const { sendPasswordResetEmail } = require("../utils/email");

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { email, password, organization, createOrg } = req.body;

    // 🔥 VALIDATION
    if (!email || !password) {
      return errorResponse(res, 400, "Email and password are required");
    }

    if (password.length < 8) {
      return errorResponse(res, 400, "Password must be at least 8 characters");
    }

    if (!organization) {
      return errorResponse(res, 400, "Organization is required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 👤 CREATE USER
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: "user",
    });

    let org;
    let userRole = "user";

    // ================= CREATE ORG =================
    if (createOrg) {
      const existingOrg = await Organization.findOne({ name: organization });

      if (existingOrg) {
        return errorResponse(res, 400, "Organization already exists");
      }

      org = await Organization.create({
        name: organization,
        owner: newUser._id,
        members: [
          {
            user: newUser._id,
            role: "admin",
            joinedAt: new Date(),
          },
        ],
      });

      userRole = "admin";

      await User.findByIdAndUpdate(newUser._id, {
        organization: org._id,
        role: "admin",
      });

    } else {
      // ================= JOIN ORG =================
      org = await Organization.findOne({ name: organization });

      if (!org) {
        return errorResponse(res, 400, "Organization not found");
      }

      org.members.push({
        user: newUser._id,
        role: "member",
        joinedAt: new Date(),
      });

      await org.save();

      await User.findByIdAndUpdate(newUser._id, {
        organization: org._id,
      });
    }

    const token = generateToken(newUser);

    // ================= RESPONSE =================
    res.status(201).json({
      token,
      expiresIn: 3600,
      user: {
        _id: newUser._id,
        email: newUser.email,
        role: userRole,
        organization: {
          id: org._id,
          name: org.name,
          role: userRole,
        },
      },
      success: true,
      message: "User registered successfully",
    });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .select("+password")
      .populate("organization", "name");

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return errorResponse(res, 401, "Invalid credentials");
    }

    const token = generateToken(user);

    res.status(200).json({
      token,
      expiresIn: 3600,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        organization: user.organization
          ? {
              id: user.organization._id,
              name: user.organization.name,
            }
          : null,
      },
      success: true,
      message: "Login successful",
    });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ================= LOGOUT =================
exports.logout = (req, res) => {
  successResponse(res, 200, "User logged out");
};

// ================= GET USERS =================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    successResponse(res, 200, "Users retrieved successfully", users);
  } catch (error) {
    errorResponse(res, 500, error.message);
  }
};

// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return successResponse(res, 200, "If account exists, email sent");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save({ validateModifiedOnly: true });

    await sendPasswordResetEmail(email, resetToken);

    successResponse(res, 200, "Reset email sent");

  } catch (error) {
    errorResponse(res, 500, error.message);
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return errorResponse(res, 400, "Token and password required");
    }

    if (password.length < 8) {
      return errorResponse(res, 400, "Password must be at least 8 characters");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return errorResponse(res, 400, "Invalid or expired token");
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save({ validateModifiedOnly: true });

    successResponse(res, 200, "Password reset successful");

  } catch (error) {
    errorResponse(res, 500, error.message);
  }
};
