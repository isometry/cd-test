import * as core from '@actions/core';
import * as exec from '@actions/exec';

async function run() {
  try {
    const baseRef: string = core.getInput('baseRef');
    const headRef: string = core.getInput('headRef');

    console.log(`Fast-Forwarding ${baseRef} to ${headRef}`);

    // Merge PR with --ff-only
    await exec.exec('git', ['switch', baseRef]);
    await exec.exec('git', ['merge', '--ff-only', `origin/${headRef}`]);
    await exec.exec('git', ['push', 'origin', baseRef]);

    return;
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
