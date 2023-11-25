// Import necessary modules
import { subject } from '../config/dbconnection.js';

class PaperGenerator {
  static generatePaper = async (req, res) => {
    try {
      const { marks, easy, medium, hard, topic } = req.query;
      let easyPercentage = parseFloat(((parseFloat(easy) / 100) * marks).toFixed(3));
      let mediumPercentage = parseFloat(((parseFloat(medium) / 100) * marks).toFixed(3));
      let hardPercentage = parseFloat(((parseFloat(hard) / 100) * marks).toFixed(3));
      

      // Check if the sum of percentages matches the specified total marks
      console.log( easyPercentage,mediumPercentage,hardPercentage)
      if ((easyPercentage + mediumPercentage + hardPercentage) != marks) {
        return res.status(400).send("Your percentages do not match the specified total marks. Please check.");
      }

      // Check if any percentage is a fraction and adjust if needed
      if (!Number.isInteger(easyPercentage) || !Number.isInteger(mediumPercentage) || !Number.isInteger(hardPercentage)) {
        const adjustedMarks = PaperGenerator.adjustFractionPercentage(easyPercentage, mediumPercentage, hardPercentage, marks);
        easyPercentage = adjustedMarks.easy;
        mediumPercentage = adjustedMarks.medium;
        hardPercentage = adjustedMarks.hard;
      }

      // Fetch questions in parallel
      const [easyQuestionsData, mediumQuestionsData, hardQuestionsData] = await Promise.all([
        PaperGenerator.fetchQuestions("Easy", topic, easyPercentage),
        PaperGenerator.fetchQuestions("Medium", topic, mediumPercentage),
        PaperGenerator.fetchQuestions("Hard", topic, hardPercentage),
      ]);

      const allQuestions = [...easyQuestionsData, ...mediumQuestionsData, ...hardQuestionsData];

      // Calculate and count for each level and each marks category
      const totalMarks = PaperGenerator.calculateTotalMarks([easyQuestionsData, mediumQuestionsData, hardQuestionsData]);
      const counts = PaperGenerator.calculateCounts([easyQuestionsData, mediumQuestionsData, hardQuestionsData]);

      res.json({
        success: true,
        message: 'Paper generated successfully',
        paper: allQuestions,
        totalMarks,
        counts,
      });
    } catch (error) {
      console.error('Error generating paper:', error.message);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };

  static adjustFractionPercentage = (easyPercentage, mediumPercentage, hardPercentage, marks) => {
    // Round up each percentage to the nearest whole number
    const roundedEasyPercentage = Math.ceil(easyPercentage);
    const roundedMediumPercentage = Math.ceil(mediumPercentage);
    const roundedHardPercentage = marks - roundedEasyPercentage - roundedMediumPercentage;

    return { easy: roundedEasyPercentage, medium: roundedMediumPercentage, hard: roundedHardPercentage };
  };

  static calculateQuestionsCount = (marks, easy, medium, hard, marksPerQuestion) => {
    return {
      easyQuestionsCount: Math.floor((marks * easy) / marksPerQuestion.easy),
      mediumQuestionsCount: Math.floor((marks * medium) / marksPerQuestion.medium),
      hardQuestionsCount: Math.floor((marks * hard) / marksPerQuestion.hard),
    };
  };

  static fetchQuestions = async (difficulty, topic, marks) => {
    const query = subject.find({ difficulty, ...(topic && { topic: topic }) });

    const cursor = await query;
    const questionsArray = await cursor.toArray();

    const limitfive = Math.floor(marks / 5);
    const limitthree = Math.floor((marks - 5 * limitfive) / 3);
    const limitone = marks - 5 * limitfive - 3 * limitthree;

    const fiveMarksQuestions = PaperGenerator.filterQuestionsByMarks(questionsArray, 5).slice(0, limitfive);
    const threeMarksQuestions = PaperGenerator.filterQuestionsByMarks(questionsArray, 3).slice(0, limitthree);
    const oneMarkQuestions = PaperGenerator.filterQuestionsByMarks(questionsArray, 1).slice(0, limitone);

    const interleavedQuestions = PaperGenerator.interleaveQuestions(fiveMarksQuestions, threeMarksQuestions, oneMarkQuestions);

    // Check if there are enough questions to fulfill the conditions
    if ((marks - 5 * limitfive - 3 * limitthree - limitone) !== 0) {
      throw new Error('Not enough questions to fulfill the conditions.');
    }

    return interleavedQuestions;
  };

  static calculateTotalMarks = (questionsData) => {
    return {
      easy: PaperGenerator.calculateTotalMarksForLevel(questionsData[0]),
      medium: PaperGenerator.calculateTotalMarksForLevel(questionsData[1]),
      hard: PaperGenerator.calculateTotalMarksForLevel(questionsData[2]),
    };
  };

  static calculateTotalMarksForLevel = (questions) => {
    return questions.reduce((total, question) => total + question.marks, 0);
  };

  static calculateCounts = (questionsData) => {
    return {
      easy: PaperGenerator.calculateCountsForLevel(questionsData[0]),
      medium: PaperGenerator.calculateCountsForLevel(questionsData[1]),
      hard: PaperGenerator.calculateCountsForLevel(questionsData[2]),
    };
  };

  static calculateCountsForLevel = (questions) => {
    return {
      oneMark: PaperGenerator.countQuestionsByMarks(questions, 1),
      threeMarks: PaperGenerator.countQuestionsByMarks(questions, 3),
      fiveMarks: PaperGenerator.countQuestionsByMarks(questions, 5),
    };
  };

  static filterQuestionsByMarks = (questions, marks) => {
    return questions.filter(question => question.marks === marks);
  };

  static countQuestionsByMarks = (questions, marks) => {
    return questions.filter(question => question.marks === marks).length;
  };

  static interleaveQuestions = (arr1, arr2, arr3) => {
    const result = [];
    const maxLength = Math.max(arr1.length, arr2.length, arr3.length);

    for (let i = 0; i < maxLength; i++) {
      arr1.length > i && result.push(arr1[i]);
      arr2.length > i && result.push(arr2[i]);
      arr3.length > i && result.push(arr3[i]);
    }

    return result;
  };
}

export default PaperGenerator;
