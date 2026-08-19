import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import ContactSubmission from '../models/ContactSubmission';
import Notification from '../models/Notification';
import { emitAdminNotification, emitDashboardStatsUpdate } from '../realtime/socket';
import { createSearchRegex } from '../utils/search';

export const createContactSubmission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Honeypot: the visible form ships a hidden "website" field humans never
    // fill. A non-empty value almost always means a bot, so the response is a
    // fake success — telling a bot it was caught only helps it adapt.
    //
    // It is STORED (flagged) rather than dropped: browser autofill and password
    // managers do ignore `autocomplete="off"`, so a silent discard throws away
    // real enquiries and nobody ever learns it happened. Storing keeps a false
    // positive recoverable. The write is best-effort — a bot's payload often
    // fails schema validation, and that must not turn into a 500.
    if (typeof req.body?.website === 'string' && req.body.website.trim()) {
      try {
        await ContactSubmission.create({
          name: req.body.name,
          email: req.body.email,
          message: req.body.message,
          locale: req.body.locale,
          isSpam: true,
          // Archived, not 'new': the dashboard counts
          // `countDocuments({ status: 'new' })`, so leaving these at the
          // default would inflate the "new enquiries" badge with bot traffic
          // and bury genuine messages. Still stored and still searchable, so a
          // false positive from browser autofill remains recoverable.
          status: 'archived',
        });
      } catch {
        // Malformed bot payload — nothing worth keeping, and nothing to report.
      }

      res.status(201).json({
        success: true,
        message: 'Your message has been sent successfully. We will contact you soon.',
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
        errors: errors.array(),
      });
      return;
    }

    const submission = await ContactSubmission.create({
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
      // Which language the enquiry was written in, so the team replies in it.
      locale: req.body.locale,
    });

    // Everything past this point is internal bookkeeping. It is deliberately
    // NOT allowed to fail the request: the visitor's message is already saved,
    // and answering 500 here made them send it again — one enquiry, two rows.
    try {
      emitAdminNotification({
        type: 'contact',
        title: `Contact form from ${submission.name}`,
        entityId: submission._id.toString(),
        createdAt: submission.createdAt?.toISOString?.() || new Date().toISOString(),
      });

      await Notification.create({
        type: 'contact',
        title: `New Contact Form`,
        message: `Contact form from ${submission.name} (${submission.email})`,
        entityId: submission._id,
      });

      void emitDashboardStatsUpdate();
    } catch (notifyError) {
      console.error('Contact submission saved but notification failed:', notifyError);
    }

    // No `data` echo: the public caller only needs success + message, and
    // reflecting the stored document (ids, timestamps) serves nobody.
    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will contact you soon.',
    });
  } catch (error) {
    console.error('Error creating contact submission:', error);
    if ((error as any)?.name === 'ValidationError') {
      const errors = (error as any)?.errors;
      const firstError = errors ? Object.values(errors)[0] : null;
      const message = (firstError as any)?.message || 'Validation failed';

      res.status(400).json({
        success: false,
        error: message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to send your message. Please try again later.',
    });
  }
};

export const createTravelTradeSubmission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Silent honeypot drop. The real company website field is
    // `companyWebsite`; only bots should fill the hidden `website` field.
    if (typeof req.body?.website === 'string' && req.body.website.trim()) {
      res.status(201).json({
        success: true,
        message: 'Your partnership request has been received.',
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
      return;
    }

    const submission = await ContactSubmission.create({
      source: 'travel-trade',
      inquiryType: req.body.inquiryType,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      companyName: req.body.companyName,
      companyWebsite: req.body.companyWebsite,
      country: req.body.country,
      businessType: req.body.businessType,
      primaryMarket: req.body.primaryMarket,
      annualTravelers: req.body.annualTravelers,
      travelDates: req.body.travelDates,
      travelers: req.body.travelers,
      destinations: req.body.destinations,
      serviceLanguage: req.body.serviceLanguage,
      serviceLevel: req.body.serviceLevel,
      message: req.body.message,
      consentGiven: true,
      locale: req.body.locale,
    });

    emitAdminNotification({
      type: 'contact',
      title: `Travel trade inquiry from ${submission.name}`,
      entityId: submission._id.toString(),
      createdAt: submission.createdAt?.toISOString?.() || new Date().toISOString(),
    });

    await Notification.create({
      type: 'contact',
      title: 'New Travel Trade Inquiry',
      message: `Travel trade inquiry from ${submission.name} (${submission.companyName})`,
      entityId: submission._id,
    });

    void emitDashboardStatsUpdate();

    res.status(201).json({
      success: true,
      message: 'Your partnership request has been received.',
    });
  } catch (error) {
    console.error('Error creating travel trade submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit the partnership request. Please try again later.',
    });
  }
};

export const getAllContactSubmissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const searchRegex = createSearchRegex(search);
    if (searchRegex) {
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { message: searchRegex },
        { companyName: searchRegex },
        { country: searchRegex },
        { destinations: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const submissions = await ContactSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ContactSubmission.countDocuments(query);

    res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact submissions',
    });
  }
};

export const updateContactSubmission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, adminNotes } = req.body;

    const submission = await ContactSubmission.findById(req.params.id);

    if (!submission) {
      res.status(404).json({
        success: false,
        error: 'Contact submission not found',
      });
      return;
    }

    if (status) {
      submission.status = status;
    }

    if (adminNotes !== undefined) {
      submission.adminNotes = adminNotes;
    }

    await submission.save();

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: 'Contact submission updated successfully',
      data: submission,
    });
  } catch (error) {
    console.error('Error updating contact submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact submission',
    });
  }
};

export const deleteContactSubmission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const submission = await ContactSubmission.findById(req.params.id);

    if (!submission) {
      res.status(404).json({
        success: false,
        error: 'Contact submission not found',
      });
      return;
    }

    await submission.deleteOne();

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: 'Contact submission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contact submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete contact submission',
    });
  }
};
