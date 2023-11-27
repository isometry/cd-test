import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';

async function run() {
  const token: string = core.getInput('github-token', { required: true })
  const github = getOctokit(token);

  try {
    const targetRefs: string[] = JSON.parse(core.getInput('targetRefs'));
    const { owner, repo } = context.repo;

    console.log(`Finding PRs for ${owner}/${repo} with targetRefs: ${targetRefs}`)

    const { data: openPRs } = await github.rest.pulls.list({
      owner,
      repo,
      state: 'open',
    });

    console.log(`Found ${openPRs.length} open PRs: ${openPRs.map(pr => pr.url)}}`)

    const pr = openPRs.find(pr => pr.head.sha == context.sha);

    if (pr) {
      console.log(`Found PR: ${pr.number}; baseRef: ${pr.base.ref}; headRef: ${pr.head.ref}`)
      const { data: prDetails } = await github.rest.pulls.get({
        owner,
        repo,
        pull_number: pr.number,
      });

      const isMergeable = targetRefs.includes(prDetails.base.ref) &&
        prDetails.rebaseable &&
        ['clean', 'unstable'].includes(prDetails.mergeable_state);

      if (isMergeable) {
        console.log(`Found mergeable PR: ${prDetails.number}; baseRef: ${prDetails.base.ref}; headRef: ${prDetails.head.ref}`);
        core.setOutput('found', true);
        core.setOutput('baseRef', prDetails.base.ref);
        core.setOutput('headRef', prDetails.head.ref);
        core.setOutput('prNumber', prDetails.number);
        return
      }
      console.log(`Found non-mergeable PR: ${prDetails.number}; baseRef: ${prDetails.base.ref}; headRef: ${prDetails.head.ref}`);
      core.setOutput('found', false);
      return
    }
    console.log(`No PR found`);
    core.setOutput('found', false);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : 'An unknown error occurred');
  }
}

run();
