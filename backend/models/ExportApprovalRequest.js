const mongoose = require('mongoose');

const exportApprovalRequestSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    requestSignature: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
      index: true,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requesterRole: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    requesterName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    format: {
      type: String,
      default: 'pdf',
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'fulfilled', 'expired'],
      default: 'pending',
      index: true,
    },
    filters: {
      schoolYear: {
        type: String,
        default: 'all',
        trim: true,
      },
      department: {
        type: String,
        default: 'all',
        trim: true,
      },
      gradeLevel: {
        type: String,
        default: 'all',
        trim: true,
      },
      searchTerm: {
        type: String,
        default: '',
        trim: true,
      },
    },
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    studentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reviewerName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 160,
    },
    reviewNote: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

exportApprovalRequestSchema.index({ requestType: 1, status: 1, createdAt: -1 });
exportApprovalRequestSchema.index({ requesterId: 1, requestType: 1, createdAt: -1 });
exportApprovalRequestSchema.index({ requesterId: 1, requestSignature: 1, createdAt: -1 });

module.exports = mongoose.model('ExportApprovalRequest', exportApprovalRequestSchema);
