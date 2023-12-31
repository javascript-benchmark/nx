import { execSync } from 'child_process';
import { resolve } from 'path';
import { output } from '../output';

export function showNxWarning(workspaceName: string) {
  try {
    const pathToRunNxCommand = resolve(process.cwd(), workspaceName);
    execSync('nx --version', {
      cwd: pathToRunNxCommand,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
  } catch (e) {
    // no nx found
    output.addVerticalSeparator();
    output.note({
      title: `Nx CLI is not installed globally.`,
      bodyLines: [
        `This means that you might have to use "yarn nx" or "npx nx" to execute commands in the workspace.`,
        `Run "yarn global add nx" or "npm install -g nx" to be able to execute command directly.`,
      ],
    });
  }
}
