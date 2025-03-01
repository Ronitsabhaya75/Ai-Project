require('dotenv').config(); // Load environment variables
const db = require("../config/database");
const { initializeModules } = require("../controller/moduleController"); // Import initializeModules

// Predefined questions with test cases
const questions = [
  {
    question_text: "Given an integer array nums, return true if any value appears more than once in the array, otherwise return false.",
    difficulty: "easy",
    company_tag: "Microsoft",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: "[1, 2, 3, 3]", output: "true" },
      { input: "[1, 2, 3, 4]", output: "false" }
    ]
  },
  {
    question_text: "Given two strings s and t, return true if the two strings are anagrams of each other, otherwise return false. An anagram is a string that contains the exact same characters as another string, but the order of the characters can be different.",
    difficulty: "easy",
    company_tag: "Uber",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: "s = 'racecar', t = 'carrace'", output: "true" },
      { input: "s = 'jar', t = 'jam'", output: "false" }
    ]
  },
  {
    question_text: "Given an array of integers nums and an integer target, return the indices i and j such that nums[i] + nums[j] == target and i != j. You may assume that every input has exactly one pair of indices i and j that satisfy the condition. Return the answer with the smaller index first.",
    difficulty: "easy",
    company_tag: "Google",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: "[2, 7, 11, 15], target = 9", output: "[0, 1]" },
      { input: "[3, 2, 4], target = 6", output: "[1, 2]" }
    ]
  },
  {
    question_text: "Given an array of strings strs, group all anagrams together into sublists. You may return the output in any order.  An anagram is a string that contains the exact same characters as another string, but the order of the characters can be different.",
    difficulty: "medium",
    company_tag: "amazon",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: 'strs = ["act","pots","tops","cat","stop","hat"]', output: '[["hat"],["act", "cat"],["stop", "pots", "tops"]]' },
      { input: 'strs = [""]', output: '[[""]]' }
    ]
  },
  {
    question_text: "Given an integer array nums and an integer k, return the k most frequent elements within the array. The test cases are generated such that the answer is always unique. You may return the output in any order.",
    difficulty: "medium",
    company_tag: "amazon",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: 'nums = [1,2,2,3,3,3], k = 2', output: 'Output: [2,3]' },
      { input: 'nums = [7,7], k = 1', output: '[7]' }
    ]
  },
  {
    question_text: "Design an algorithm to encode a list of strings to a single string. The encoded string is then decoded back to the original list of strings. Please implement encode and decode",
    difficulty: "medium",
    company_tag: "Facebook",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: 'Input: ["neet","code","love","you"]', output: 'Output: ["neet","code","love","you"]' },
      { input: 'Input: ["we","say",":","yes"]', output: 'Output: ["we","say",":","yes"]' }
    ]
  },
  {
    question_text: "Given an integer array nums, return an array output where output[i] is the product of all the elements of nums except nums[i]. Each product is guaranteed to fit in a 32-bit integer. Follow-up: Could you solve it in O(n) time without using the division operation?",
    difficulty: "medium",
    company_tag: "amazon",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]' }
    ]
  },
  {
    question_text: "You are given a a 9 x 9 Sudoku board board. A Sudoku board is valid if the following rules are followed: Each row must contain the digits 1-9 without duplicates. Each column must contain the digits 1-9 without duplicates. Each of the nine 3 x 3 sub-boxes of the grid must contain the digits 1-9 without duplicates. Return true if the Sudoku board is valid, otherwise return false Note: A board does not need to be full or be solvable to be valid.",
    difficulty: "medium",
    company_tag: "amazon",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: 'board = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]', output: 'true' }
    ]
  },
  {
    question_text: "Given an array of integers nums, return the length of the longest consecutive sequence of elements that can be formed. A consecutive sequence is a sequence of elements in which each element is exactly 1 greater than the previous element. The elements do not have to be consecutive in the original array. You must write an algorithm that runs in O(n) time.",
    difficulty: "medium",
    company_tag: "google",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: 'nums = [100,4,200,1,3,2]', output: '4' },
      { input: 'nums = [0,3,2,5,4,6,1,1]', output: '7' }
    ]
  },
  {
    question_text: "Given a string s, return true if it is a palindrome, otherwise return false. A palindrome is a string that reads the same forward and backward. It is also case-insensitive and ignores all non-alphanumeric characters.",
    difficulty: "easy",
    company_tag: "Spotify",
    module_name: "Two Pointers",
    test_cases: [
      { input: 's = Was it a car or a cat I saw?', output: 'true' },
      { input: 's = tab a cat', output: 'false' }
    ]
  },
  // Add more questions here
];

// Function to insert questions and test cases
const insertQuestions = async () => {
  try {
    for (const q of questions) {
      // Insert question
      const question = await db.one(
        `INSERT INTO questions (question_text, difficulty, company_tag, module_id)
         VALUES ($1, $2, $3, (SELECT id FROM modules WHERE name = $4))
         RETURNING id`,
        [q.question_text, q.difficulty, q.company_tag, q.module_name]
      );

      // Insert test cases
      for (const tc of q.test_cases) {
        await db.none(
          `INSERT INTO test_cases (question_id, input, output)
           VALUES ($1, $2, $3)`,
          [question.id, tc.input, tc.output]
        );
      }
    }

    console.log("✅ Questions and test cases inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting questions:", error);
  }
};

// Initialize data (modules and questions)
const initializeData = async () => {
  try {
    await initializeModules(); // Initialize modules

    // Check if questions already exist
    const questionCount = await db.one("SELECT COUNT(*) FROM questions");
    if (questionCount.count === 0) {
      await insertQuestions(); // Insert questions only if the table is empty
    }

    console.log("✅ Data initialization complete");
  } catch (error) {
    console.error("❌ Data initialization failed:", error);
  }
};

// Export functions
module.exports = { insertQuestions, initializeData };