const Docker = require('dockerode');
const { APIError } = require('../utils/errors');

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  timeout: parseInt(process.env.DOCKER_TIMEOUT) || 5000
});

const executeCode = async (code, testCases) => {
  try {
    if (!code || !Array.isArray(testCases) || testCases.length === 0) {
      throw new APIError("Code and test cases must be provided", 400);
    }

    const results = [];
    
    for (const [index, testCase] of testCases.entries()) {
      const script = `
import sys
try:
    input_data = """${testCase.input}"""
    sys.stdin = open(0)  # Ensure input redirection
    exec("""${code}""")
except Exception as e:
    print("Error:", str(e))
`;

      const container = await docker.createContainer({
        Image: 'python:3.9-slim',
        Cmd: ['python', '-c', script],
        AttachStdout: true,
        AttachStderr: true,
        HostConfig: {
          AutoRemove: true,
          Memory: 128 * 1024 * 1024, // 128MB memory limit
          CpuPeriod: 100000,
          CpuQuota: 50000, // Limit CPU usage
          NetworkMode: 'none'
        }
      });

      const startTime = Date.now();
      await container.start();
      const exitData = await container.wait();
      const executionTime = Date.now() - startTime;

      const logs = await container.logs({ stdout: true, stderr: true });
      const output = logs.toString().trim();

      results.push({
        testCaseId: index + 1,
        input: testCase.input,
        output: output,
        expected: testCase.output,
        status: output === testCase.output ? 'passed' : 'failed',
        executionTime: `${executionTime}ms`
      });
    }

    return results;
  } catch (error) {
    console.error("Docker Execution Error:", error);
    throw new APIError(`Code execution failed: ${error.message}`, 500);
  }
};

module.exports = { executeCode };
