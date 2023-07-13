import {
  logger,
  Tree,
  formatFiles,
  updateProjectConfiguration,
  getProjects,
} from '@nx/devkit';
import { findStorybookAndBuildTargetsAndCompiler } from '../../utils/utilities';

export default async function setProjectBuildConfig(tree: Tree) {
  let changesMade = false;
  const projects = getProjects(tree);
  [...projects.entries()].forEach(([projectName, projectConfiguration]) => {
    if (!projectConfiguration.targets) {
      return;
    }
    const { storybookBuildTarget, storybookTarget, ngBuildTarget } =
      findStorybookAndBuildTargetsAndCompiler(projectConfiguration.targets);
    if (
      projectName &&
      storybookTarget &&
      projectConfiguration?.targets?.[storybookTarget]?.options?.uiFramework ===
        '@storybook/angular'
    ) {
      if (ngBuildTarget) {
        if (
          !projectConfiguration.targets[storybookTarget].options
            .projectBuildConfig
        ) {
          projectConfiguration.targets[
            storybookTarget
          ].options.projectBuildConfig = projectName;
          changesMade = true;
        }
        if (
          storybookBuildTarget &&
          !projectConfiguration.targets[storybookBuildTarget].options
            .projectBuildConfig
        ) {
          projectConfiguration.targets[
            storybookBuildTarget
          ].options.projectBuildConfig = projectName;
          changesMade = true;
        }
      } else {
        if (storybookBuildTarget) {
          if (
            !projectConfiguration.targets[storybookTarget].options
              .projectBuildConfig
          ) {
            projectConfiguration.targets[
              storybookTarget
            ].options.projectBuildConfig = `${projectName}:${storybookBuildTarget}`;
            changesMade = true;
          }
          if (
            !projectConfiguration.targets[storybookBuildTarget].options
              .projectBuildConfig
          ) {
            projectConfiguration.targets[
              storybookBuildTarget
            ].options.projectBuildConfig = `${projectName}:${storybookBuildTarget}`;
            changesMade = true;
          }
        } else {
          logger.warn(`Could not find a build target for ${projectName}.`);
        }
      }

      if (changesMade) {
        updateProjectConfiguration(tree, projectName, projectConfiguration);
      }
    }
  });

  if (changesMade) {
    await formatFiles(tree);
  }
}
