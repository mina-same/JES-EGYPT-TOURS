import { updateRequestRecord } from '../utils/requestWorkflow';
import { notifySubmission } from '../utils/submissionNotification';
import { paginationInput, respondSubmissionError, savePublicSubmission } from '../utils/submission';
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import ContactSubmission from '../models/ContactSubmission';
import { emitDashboardStatsUpdate } from '../realtime/socket';
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

    const { document: submission, replay } = await savePublicSubmission(ContactSubmission, req, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      message: req.body.message,
      // Which language the enquiry was written in, so the team replies in it.
      locale: req.body.locale,
    });

    // Everything past this point is internal bookkeeping. It is deliberately
    // NOT allowed to fail the request: the visitor's message is already saved,
    // and answering 500 here made them send it again — one enquiry, two rows.
    if (!replay) await notifySubmission('contact', submission, 'New Contact Form', `Contact form from ${submission.name} (${submission.email})`);

    // No `data` echo: the public caller only needs success + message, and
    // reflecting the stored document (ids, timestamps) serves nobody.
    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will contact you soon.',
    });
  } catch (error) {
    console.error('Error creating contact submission:', error);
    respondSubmissionError(res, error, 'Failed to send your message. Please try again later.');
  }
};

/**
 * A question asked from a tour page.
 *
 * Lands in the same collection as every other enquiry so the team works one
 * inbox, tagged `tour-question` and carrying the tour it came from. The tour
 * NAME is copied in rather than referenced: an enquiry has to keep saying what
 * it was about even after that tour is renamed, unpublished or deleted.
 */
export const createTourQuestionSubmission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Same honeypot rule as the contact form: flagged and archived rather than
    // dropped, because autofill does fill hidden fields and a silent discard
    // would throw away real questions with no trace.
    if (typeof req.body?.website === 'string' && req.body.website.trim()) {
      try {
        await ContactSubmission.create({
          source: 'tour-question',
          name: req.body.name,
          email: req.body.email,
          message: req.body.message,
          tourName: req.body.tourName,
          tourSlug: req.body.tourSlug,
          locale: req.body.locale,
          isSpam: true,
          status: 'archived',
        });
      } catch {
        // Malformed bot payload: nothing worth keeping.
      }

      res.status(201).json({
        success: true,
        message: 'Your question has been sent. We usually reply within 24 hours.',
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

    const { document: submission, replay } = await savePublicSubmission(ContactSubmission, req, {
      source: 'tour-question',
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      message: req.body.message,
      preferredDate: req.body.preferredDate,
      tourName: req.body.tourName,
      tourSlug: req.body.tourSlug,
      locale: req.body.locale,
    });

    // Bookkeeping only. The visitor's question is already saved, so none of
    // this is allowed to fail the request.
    if (!replay) await notifySubmission('contact', submission, 'New Tour Question', submission.tourName ? `${submission.name} asked about ${submission.tourName}` : `Tour question from ${submission.name}`);

    res.status(201).json({
      success: true,
      message: 'Your question has been sent. We usually reply within 24 hours.',
    });
  } catch (error) {
    console.error('Error creating tour question submission:', error);
    respondSubmissionError(res, error, 'Something went wrong. Please try again.');
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

    const { document: submission, replay } = await savePublicSubmission(ContactSubmission, req, {
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

    if (!replay) await notifySubmission('contact', submission, 'New Travel Trade Inquiry', `Travel trade inquiry from ${submission.name} (${submission.companyName})`);

    res.status(201).json({
      success: true,
      message: 'Your partnership request has been received.',
    });
  } catch (error) {
    console.error('Error creating travel trade submission:', error);
    respondSubmissionError(res, error, 'Failed to submit the partnership request. Please try again later.');
  }
};

export const getAllContactSubmissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, search } = req.query;
    const { page, limit, skip } = paginationInput(req.query, 20);

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
    respondSubmissionError(res, error, 'Failed to fetch contact submissions');
  }
};

export const updateContactSubmission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const submission = await updateRequestRecord(ContactSubmission, req, ['new', 'replied', 'archived']);

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: 'Contact submission updated successfully',
      data: submission,
    });
  } catch (error) {
    console.error('Error updating contact submission:', error);
    respondSubmissionError(res, error, 'Failed to update contact submission');
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
    respondSubmissionError(res, error, 'Failed to delete contact submission');
  }
};

export const getContactSubmissionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const document = await ContactSubmission.findById(req.params.id);
    if (!document) { res.status(404).json({ success: false, error: 'Request not found' }); return; }
    res.json({ success: true, data: document });
  } catch (error) { respondSubmissionError(res, error, 'Failed to load request'); }
};
export const getContactStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await ContactSubmission.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const count = (status: string) => rows.find(row => row._id === status)?.count || 0;
    res.json({ success: true, data: { total: rows.reduce((n, row) => n + row.count, 0), new: count('new'), replied: count('replied'), archived: count('archived') } });
  } catch (error) { respondSubmissionError(res, error, 'Failed to load statistics'); }
};
