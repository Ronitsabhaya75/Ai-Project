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
      { input: "[1, 2, 3, 3]", output: "true" }
    ]
  },
  {
    question_text: "Given two strings s and t, return true if the two strings are anagrams of each other, otherwise return false. An anagram is a string that contains the exact same characters as another string, but the order of the characters can be different.",
    difficulty: "easy",
    company_tag: "Uber",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: "s = 'racecar', t = 'carrace'", output: "true" }
    ]
  },
  {
    question_text: "Given an array of integers nums and an integer target, return the indices i and j such that nums[i] + nums[j] == target and i != j. You may assume that every input has exactly one pair of indices i and j that satisfy the condition. Return the answer with the smaller index first.",
    difficulty: "easy",
    company_tag: "Google",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: "[2, 7, 11, 15], target = 9", output: "[0, 1]" }
    ]
  },
  {
    question_text: "Given an array of strings strs, group all anagrams together into sublists. You may return the output in any order.  An anagram is a string that contains the exact same characters as another string, but the order of the characters can be different.",
    difficulty: "medium",
    company_tag: "amazon",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: 'strs = ["act","pots","tops","cat","stop","hat"]', output: '[["hat"],["act", "cat"],["stop", "pots", "tops"]]' }
    ]
  },
  {
    question_text: "Given an integer array nums and an integer k, return the k most frequent elements within the array. The test cases are generated such that the answer is always unique. You may return the output in any order.",
    difficulty: "medium",
    company_tag: "amazon",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: 'nums = [1,2,2,3,3,3], k = 2', output: 'Output: [2,3]' }
    ]
  },
  {
    question_text: "Design an algorithm to encode a list of strings to a single string. The encoded string is then decoded back to the original list of strings. Please implement encode and decode",
    difficulty: "medium",
    company_tag: "Facebook",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: 'Input: ["neet","code","love","you"]', output: 'Output: ["neet","code","love","you"]' }
    ]
  },
  {
    question_text: "Given an integer array nums, return an array output where output[i] is the product of all the elements of nums except nums[i]. Each product is guaranteed to fit in a 32-bit integer. Follow-up: Could you solve it in O(n) time without using the division operation?",
    difficulty: "medium",
    company_tag: "amazon",
    module_name: "Arrays & Hashing",
    test_cases: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' }
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
      { input: 'nums = [100,4,200,1,3,2]', output: '4' }
    ]
  },
  {
    question_text: "Given a string s, return true if it is a palindrome, otherwise return false. A palindrome is a string that reads the same forward and backward. It is also case-insensitive and ignores all non-alphanumeric characters.",
    difficulty: "easy",
    company_tag: "Spotify",
    module_name: "Two Pointers",
    test_cases: [
      { input: 's = Was it a car or a cat I saw?', output: 'true' }
    ]
  },
  {
    question_text: "Given an array of integers numbers that is sorted in non-decreasing order. Return the indices (1-indexed) of two numbers, [index1, index2], such that they add up to a given target number target and index1 < index2. Note that index1 and index2 cannot be equal, therefore you may not use the same element twice. There will always be exactly one valid solution. Your solution must use O(1) additional space.",
    difficulty: "easy",
    company_tag: "amazon",
    module_name: "Two Pointers",
    test_cases: [
      { input: 'numbers = [2,7,11,15], target = 9', output: '[0, 1]' }
    ]
  },
  {
    question_text: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] where nums[i] + nums[j] + nums[k] == 0, and the indices i, j and k are all distinct. The output should not contain any duplicate triplets. You may return the output and the triplets in any order.",
    difficulty: "medium",
    company_tag: "facebook",
    module_name: "Two Pointers",
    test_cases: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]' }
    ]
  },
  {
    question_text: "You are given an integer array heights where heights[i] represents the height of the ith bar. You may choose any two bars to form a container. Return the maximum amount of water a container can store.", 
    difficulty: "medium",
    company_tag: "Facebook and Google",
    module_name: "Two Pointers",
    test_cases: [
      { input: 'heights = [1,7,2,5,4,7,3,6]', output: '36' }
    ]
  },
  {
    question_text: "You are given an array non-negative integers height which represent an elevation map. Each value height[i] represents the height of a bar, which has a width of 1. Return the maximum area of water that can be trapped between the bars.",
    difficulty: "hard",
    company_tag: "Google",
    module_name: "Two Pointers",
    test_cases: [
      { input: 'height = [0,2,0,3,1,0,1,3,2,1]', output: '9' }
    ]
  },
  {
    question_text: "You are given a string s consisting of the following characters: '(', ')', '{', '}', '[' and ']'. The input string s is valid if and only if: Every open bracket is closed by the same type of close bracket. Open brackets are closed in the correct order. Every close bracket has a corresponding open bracket of the same type. Return true if s is a valid string, and false otherwise.",
    difficulty: "easy",
    company_tag: "Facebook",
    module_name: "Stacks",
    test_cases: [
      { input: 's = "()"', output: 'true' }
    ]
  },
  {
    question_text: "Design a stack class that supports the push, pop, top, and getMin operations. MinStack() initializes the stack object. void push(int val) pushes the element val onto the stack. void pop() removes the element on the top of the stack. int top() gets the top element of the stack. int getMin() retrieves the minimum element in the stack. Each function should run in O(1) time.",
    difficulty: "medium",
    company_tag: "amazon",
    module_name: "Stacks",
    test_cases: [
      { input: '["MinStack", "push", 1, "push", 2, "push", 0, "getMin", "pop", "top", "getMin"]', output: '[null,null,null,null,0,null,2,1]' },
    ]
  },
  {
    question_text: "You are given an array of strings tokens that represents a valid arithmetic expression in Reverse Polish Notation. Return the integer that represents the evaluation of the expression. The operands may be integers or the results of other operations. The operators include '+', '-', '*', and '/'. Assume that division between integers always truncates toward zero.",
    difficulty: "medium",
    company_tag: "amazon",
    module_name: "Stacks",
    test_cases: [
      { input: 'tokens = ["2","1","+","3","*"]', output: '9' },
    ]
  },

  {
    question_text: "You are given an integer n. Return all well-formed parentheses strings that you can generate with n pairs of parentheses.",
    difficulty: "medium",
    company_tag: "amazon",
    module_name: "Stacks",
    test_cases: [
      { input: 'n = 3', output: '["((()))","(()())","(())()","()(())","()()()"]' },
    ]
  },

  {
    question_text: "You are given an array of integers temperatures where temperatures[i] represents the daily temperatures on the ith day. Return an array result where result[i] is the number of days after the ith day before a warmer temperature appears on a future day. If there is no day in the future where a warmer temperature will appear for the ith day, set result[i] to 0 instead.",
    difficulty: "medium",
    company_tag: "Facebook",
    module_name: "Stacks",
    test_cases: [
      { input: 'temperatures = [73,74,75,71,69,72,76,73]', output: '[1,1,4,2,1,1,0,0]' },
    ]
  },

  {
    question_text: "There are n cars traveling to the same destination on a one-lane highway. You are given two arrays of integers position and speed, both of length n. position[i] is the position of the ith car (in miles) speed[i] is the speed of the ith car (in miles per hour) The destination is at position target miles. A car can not pass another car ahead of it. It can only catch up to another car and then drive at the same speed as the car ahead of it. A car fleet is a non-empty set of cars driving at the same position and same speed. A single car is also considered a car fleet. If a car catches up to a car fleet the moment the fleet reaches the destination, then the car is considered to be part of the fleet. Return the number of different car fleets that will arrive at the destination.",
    difficulty: "medium",
    company_tag: "Google",
    module_name: "Stacks",
    test_cases: [
      { input: 'target = 10, position = [1,4], speed = [3,2]', output: '1' },
    ]
  },

  {
    question_text: "You are given an array of integers heights where heights[i] represents the height of a bar. The width of each bar is 1. Return the area of the largest rectangle that can be formed among the bars. Note: This chart is known as a histogram.",
    difficulty: "hard",
    company_tag: "Google",
    module_name: "Stacks",
    test_cases: [
      { input: 'heights = [7,1,7,2,2,4]', output: '8' },
    ]
  },

  {
    question_text: "You are given an array of distinct integers nums, sorted in ascending order, and an integer target. Implement a function to search for target within nums. If it exists, then return its index, otherwise, return -1. Your solution must run in O(logn) time.",
    difficulty: "easy",
    company_tag: "Microsoft",
    module_name: "Binary Search",
    test_cases: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' },
    ]
  },

  {
    question_text: "You are given an m x n 2-D integer array matrix and an integer target. Each row in matrix is sorted in non-decreasing order. The first integer of every row is greater than the last integer of the previous row. Return true if target exists within matrix or false otherwise. Can you write a solution that runs in O(log(m * n)) time?",
    difficulty: "medium",
    company_tag: "Microsoft",
    module_name: "Binary Search",
    test_cases: [
      { input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3', output: 'true' },
    ]
  },

  {
    question_text: "You are given an integer array piles where piles[i] is the number of bananas in the ith pile. You are also given an integer h, which represents the number of hours you have to eat all the bananas. You may decide your bananas-per-hour eating rate of k. Each hour, you may choose a pile of bananas and eats k bananas from that pile. If the pile has less than k bananas, you may finish eating the pile but you can not eat from another pile in the same hour. Return the minimum integer k such that you can eat all the bananas within h hours.",
    difficulty: "medium",
    company_tag: "Google",
    module_name: "Binary Search",
    test_cases: [
      { input: 'piles = [1,4,3,2], h = 9', output: '2' },
    ]
  },

  {
    question_text: "You are given an array of length n which was originally sorted in ascending order. It has now been rotated between 1 and n times. For example, the array nums = [1,2,3,4,5,6] might become: [3,4,5,6,1,2] if it was rotated 4 times. [1,2,3,4,5,6] if it was rotated 6 times. Notice that rotating the array 4 times moves the last four elements of the array to the beginning. Rotating the array 6 times produces the original array. Assuming all elements in the rotated sorted array nums are unique, return the minimum element of this array. A solution that runs in O(n) time is trivial, can you write an algorithm that runs in O(log n) time?",
    difficulty: "medium",
    company_tag: "Facebook",
    module_name: "Binary Search",
    test_cases: [
      { input: 'nums = [3,4,5,1,2]', output: '1' },
    ]
  },
  {
    question_text: "You are given an array of length n which was originally sorted in ascending order. It has now been rotated between 1 and n times. For example, the array nums = [1,2,3,4,5,6] might become: [3,4,5,6,1,2] if it was rotated 4 times. [1,2,3,4,5,6] if it was rotated 6 times. Given the rotated sorted array nums and an integer target, return the index of target within nums, or -1 if it is not present. You may assume all elements in the sorted rotated array nums are unique, A solution that runs in O(n) time is trivial, can you write an algorithm that runs in O(log n) time?",
    difficulty: "medium",
    company_tag: "Google",
    module_name: "Binary Search",
    test_cases: [
      { input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4' },
    ]
  },

  {
    question_text: "Implement a time-based key-value data structure that supports: Storing multiple values for the same key at specified time stamps Retrieving the key's value at a specified timestamp Implement the TimeMap class: TimeMap() Initializes the object. void set(String key, String value, int timestamp) Stores the key key with the value value at the given time timestamp. String get(String key, int timestamp) Returns the most recent value of key if set was previously called on it and the most recent timestamp for that key prev_timestamp is less than or equal to the given timestamp (prev_timestamp <= timestamp). If there are no values, it returns ''. Note: For all calls to set, the timestamps are in strictly increasing order.",
    difficulty: "medium",
    company_tag: "Google",
    module_name: "Binary Search",
    test_cases: [
      { input: '["TimeMap", "set", ["alice", "happy", 1], "get", ["alice", 1], "get", ["alice", 2], "set", ["alice", "sad", 3], "get", ["alice", 3]]', output: '[null, null, "happy", "happy", null, "sad"]' },
    ]
  },

  {
    question_text: "You are given two integer arrays nums1 and nums2 of size m and n respectively, where each is sorted in ascending order. Return the median value among all elements of the two arrays. Your solution must run in O(log(m+n)) time.",
    difficulty: "hard",
    company_tag: "Facebook",
    module_name: "Binary Search",
    test_cases: [
      { input: 'nums1 = [1,3], nums2 = [2]', output: '2.0' },
    ]
  },

  {
    question_text: "You are given an integer array prices where prices[i] is the price of NeetCoin on the ith day. You may choose a single day to buy one NeetCoin and choose a different day in the future to sell it. Return the maximum profit you can achieve. You may choose to not make any transactions, in which case the profit would be 0.",
    difficulty: "easy",
    company_tag: "Google",
    module_name: "Sliding Window",
    test_cases: [
      { input: 'prices = [10,1,5,6,7,1]', output: '6' },
    ]
  },
  {
    question_text: "Given a string s, find the length of the longest substring without duplicate characters. A substring is a contiguous sequence of characters within a string.",
    difficulty: "medium",
    company_tag: "Facebook",
    module_name: "Sliding Window",
    test_cases: [
      { input: 's = "zxyzxyz"', output: '3' },
    ]
  },
  {
    question_text: "You are given a string s consisting of only uppercase english characters and an integer k. You can choose up to k characters of the string and replace them with any other uppercase English character. After performing at most k replacements, return the length of the longest substring which contains only one distinct character.",
    difficulty: "medium",
    company_tag: "Google",
    module_name: "Sliding Window",
    test_cases: [
      { input: 's = "XYYX", k = 2', output: '4' },
    ]
  },
  {
    question_text: "You are given two strings s1 and s2. Return true if s2 contains a permutation of s1, or false otherwise. That means if a permutation of s1 exists as a substring of s2, then return true. Both strings only contain lowercase letters.",
    difficulty: "medium",
    company_tag: "Microsoft",
    module_name: "Sliding Window",
    test_cases: [
      { input: 's1 = "abc", s2 = "lecabee"', output: 'true' },
    ]
  },

  {
    question_text: "Given two strings s and t, return the shortest substring of s such that every character in t, including duplicates, is present in the substring. If such a substring does not exist, return an empty string ''. You may assume that the correct output is always unique.",
    difficulty: "hard",
    company_tag: "Airbnb",
    module_name: "Sliding Window",
    test_cases: [
      { input: 's = "OUZODYXAZV", t = "XYZ"', output: '"YXAZ"' },
    ]
  },
  {
    question_text: "You are given an array of integers nums and an integer k. There is a sliding window of size k that starts at the left edge of the array. The window slides one position to the right until it reaches the right edge of the array. Return a list that contains the maximum element in the window at each step.",
    difficulty: "hard",
  }
];

const insertQuestions = async () => {
  try {
    // Get all modules first
    const modules = await db.many("SELECT id, name FROM modules");
    const moduleMap = new Map(modules.map(m => [m.name, m.id]));

    await db.tx(async t => {
      for (const q of questions) {
        const moduleId = moduleMap.get(q.module_name);
        if (!moduleId) {
          console.error(`❌ Module "${q.module_name}" not found. Skipping question.`);
          continue;
        }

        // Upsert question
        const question = await t.one(
          `INSERT INTO questions 
            (question_text, difficulty, company_tag, module_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (question_text) DO UPDATE SET
             difficulty = EXCLUDED.difficulty,
             company_tag = EXCLUDED.company_tag,
             module_id = EXCLUDED.module_id
           RETURNING id`,
          [q.question_text, q.difficulty, q.company_tag, moduleId]
        );

        // Upsert test cases
        const testCaseQueries = q.test_cases.map(tc => 
          t.none(
            `INSERT INTO test_cases 
              (question_id, input, output)
             VALUES ($1, $2, $3)
             ON CONFLICT (question_id, input) DO UPDATE SET
               output = EXCLUDED.output`,
            [question.id, tc.input, tc.output]
          )
        );

        await t.batch(testCaseQueries);
      }
    });

    console.log("✅ Database updated successfully");
  } catch (error) {
    console.error("❌ Update failed:", error);
    process.exit(1);
  }
};

const initializeData = async () => {
  try {
    // Always initialize modules and questions
    await initializeModules();
    await insertQuestions();
    
    // Get counts for verification
    const [questionsCount, testCasesCount] = await Promise.all([
      db.one("SELECT COUNT(*) FROM questions"),
      db.one("SELECT COUNT(*) FROM test_cases")
    ]);
    
    console.log(
      `📊 Current Stats:\n` +
      `- Questions: ${questionsCount.count}\n` +
      `- Test Cases: ${testCasesCount.count}`
    );
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    process.exit(1);
  }
};

module.exports = { initializeData, insertQuestions };