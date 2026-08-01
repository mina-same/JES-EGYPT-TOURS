import { narrowFaqsToLocale } from '../utils/localize';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Faq, { IFaq } from '../models/Faq';
import { createSearchRegex, localizedSearchFilters } from '../utils/search';

// Get all FAQs with optional filtering
export const getAllFaqs = async (req: Request, res: Response) => {
  try {
    const { 
      category, 
      isActive, 
      displayOnHome, 
      search,
      page = 1, 
      limit = 50, 
      sort = 'order' 
    } = req.query;

    // Build filter object
    const filter: any = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (displayOnHome !== undefined) filter.displayOnHome = displayOnHome === 'true';

    const searchRegex = createSearchRegex(search);
    if (searchRegex) {
      filter.$or = [
        ...localizedSearchFilters(['question', 'answer'], searchRegex),
        { category: searchRegex },
      ];
    }

    // Build sort object
    const sortObj: any = {};
    if (typeof sort === 'string') {
      const sortFields = sort.split(',');
      sortFields.forEach(field => {
        const [key, direction] = field.split(':');
        sortObj[key] = direction === 'desc' ? -1 : 1;
      });
    } else {
      sortObj.order = 1; // Default sort by order ascending
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const faqs = await Faq.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Faq.countDocuments(filter);

    res.status(200).json({
      success: true,
      // Same rule as every other FAQ on the site: a row is returned only when
      // THIS language has both a question and an answer, and it keeps the
      // { locale: text } object shape the renderers read. 'bypass' (the admin)
      // gets everything untouched.
      data: narrowFaqsToLocale(faqs, req.locale),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch FAQs'
    });
  }
};

// Get FAQs specifically for home page display
export const getHomeFaqs = async (req: Request, res: Response) => {
  try {
    const { limit = 8 } = req.query;

    const faqs = await Faq.find({ 
      isActive: true, 
      displayOnHome: true 
    })
    .sort({ order: 1 })
    .limit(parseInt(limit as string));

    res.status(200).json({
      success: true,
      data: narrowFaqsToLocale(faqs, req.locale)
    });
  } catch (error) {
    console.error('Error fetching home FAQs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch home FAQs'
    });
  }
};

// Get single FAQ by ID
export const getFaqById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid FAQ ID'
      });
      return;
    }

    const faq = await Faq.findById(id);

    if (!faq) {
      res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: faq
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch FAQ'
    });
  }
};

// Create new FAQ (admin only)
export const createFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, answer, category, isActive, displayOnHome } = req.body;

    // Validation
    if (!question || !question.en || !answer || !answer.en) {
      res.status(400).json({
        success: false,
        error: 'English question and answer are required'
      });
      return;
    }

    // Validation is handled partially by the frontend or shared schemas. Wait, schema has it.

    const faqData: Partial<IFaq> = {
      question,
      answer,
      category: category?.trim() || 'General',
      isActive: isActive !== undefined ? isActive : true,
      displayOnHome: displayOnHome !== undefined ? displayOnHome : false
    };

    const faq = new Faq(faqData);
    await faq.save();

    res.status(201).json({
      success: true,
      data: faq,
      message: 'FAQ created successfully'
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create FAQ'
    });
  }
};

// Update FAQ (admin only)
export const updateFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { question, answer, category, isActive, displayOnHome, order } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid FAQ ID'
      });
      return;
    }

    const faq = await Faq.findById(id);

    if (!faq) {
      res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
      return;
    }

    // Omit string lengths validation since they are objects

    // Update fields
    if (question !== undefined) faq.question = question;
    if (answer !== undefined) faq.answer = answer;
    if (category !== undefined) faq.category = category.trim() || 'General';
    if (isActive !== undefined) faq.isActive = isActive;
    if (displayOnHome !== undefined) faq.displayOnHome = displayOnHome;
    if (order !== undefined) faq.order = order;

    await faq.save();

    res.status(200).json({
      success: true,
      data: faq,
      message: 'FAQ updated successfully'
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update FAQ'
    });
  }
};

// Delete FAQ (admin only)
export const deleteFaq = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid FAQ ID'
      });
      return;
    }

    const faq = await Faq.findById(id);

    if (!faq) {
      res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
      return;
    }

    await Faq.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete FAQ'
    });
  }
};

// Get FAQ categories
export const getFaqCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await Faq.distinct('category', { isActive: true });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch FAQ categories'
    });
  }
};
