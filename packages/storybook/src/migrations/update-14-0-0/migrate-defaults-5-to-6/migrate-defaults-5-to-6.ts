import {
  GeneratorCallback,
  getProjects,
  installPackagesTask,
  logger,
  readProjectConfiguration,
  Tree,
  updateJson,
  visitNotIgnoredFiles,
} from '@nx/devkit';
import { lte } from 'semver';
import { checkAndCleanWithSemver } from '@nx/devkit/src/utils/semver';
import { storybookVersion } from '../../../utils/versions';
import { createProjectStorybookDir } from '../../../generators/configuration/lib/util-functions';
import { StorybookConfigureSchema } from '../../../generators/configuration/schema';
import { findStorybookAndBuildTargetsAndCompiler } from '../../../utils/utilities';

export function migrateDefaultsGenerator(tree: Tree) {
  migrateAllStorybookInstances(tree);
  return upgradeStorybookPackagesInPackageJson(tree);
}

export function migrateAllStorybookInstances(tree: Tree) {
  logger.debug('adding .storybook folder to project');
  const projects = getProjects(tree);
  const projectsThatHaveStorybookConfiguration: {
    name: string;
    uiFramework: StorybookConfigureSchema['uiFramework'];
    configFolder: string;
  }[] = [...projects.entries()]
    .filter(
      ([_, projectConfig]) =>
        projectConfig?.targets?.storybook &&
        projectConfig?.targets?.storybook?.executor !==
          '@nrwl/react-native:storybook'
    )
    .map(([projectName, projectConfig]) => {
      return {
        name: projectName,
        uiFramework: projectConfig?.targets?.storybook?.options?.uiFramework,
        configFolder:
          projectConfig?.targets?.storybook?.options?.config?.configFolder ??
          '',
      };
    });

  for (const projectWithStorybook of projectsThatHaveStorybookConfiguration) {
    migrateStorybookInstance(
      tree,
      projectWithStorybook.name,
      projectWithStorybook.uiFramework,
      projectWithStorybook.configFolder
    );
  }
}

export function migrateStorybookInstance(
  tree: Tree,
  projectName: string,
  uiFramework: StorybookConfigureSchema['uiFramework'],
  configFolder?: string
) {
  migrateProjectLevelStorybookInstance(
    tree,
    projectName,
    uiFramework,
    configFolder
  );
}

function maybeUpdateVersion(tree: Tree): GeneratorCallback {
  let needsInstall = false;
  updateJson(tree, 'package.json', (json) => {
    const ignoredStorybookPackages = [
      '@storybook/builder-vite',
      '@storybook/jest',
      '@storybook/react-native',
      '@storybook/storybook-deployer',
      '@storybook/test-runner',
      '@storybook/testing-library',
      '@storybook/testing-angular',
      '@storybook/testing-react',
      '@storybook/testing-vue',
      '@storybook/testing-vue3',
      '@storybook/addon-notes',
      '@storybook/addon-postcss',
    ];

    json.dependencies = json.dependencies || {};
    json.devDependencies = json.devDependencies || {};

    const allStorybookPackagesInDependencies = Object.keys(
      json.dependencies
    ).filter(
      (packageName: string) =>
        packageName.startsWith('@storybook/') &&
        !ignoredStorybookPackages.includes(packageName)
    );

    const allStorybookPackagesInDevDependencies = Object.keys(
      json.devDependencies
    ).filter(
      (packageName: string) =>
        packageName.startsWith('@storybook/') &&
        !ignoredStorybookPackages.includes(packageName)
    );

    const storybookPackages = [
      ...allStorybookPackagesInDependencies,
      ...allStorybookPackagesInDevDependencies,
    ];

    storybookPackages.forEach((storybookPackageName) => {
      if (json.dependencies[storybookPackageName]) {
        const version = checkAndCleanWithSemver(
          storybookPackageName,
          json.dependencies[storybookPackageName]
        );
        if (lte(version, '6.0.0')) {
          json.dependencies[storybookPackageName] = storybookVersion;
          needsInstall = true;
        }
      }
      if (json.devDependencies[storybookPackageName]) {
        const version = checkAndCleanWithSemver(
          storybookPackageName,
          json.devDependencies[storybookPackageName]
        );
        if (lte(version, '6.0.0')) {
          json.devDependencies[storybookPackageName] = storybookVersion;
          needsInstall = true;
        }
      }
    });
    return json;
  });

  if (needsInstall) {
    return () => installPackagesTask(tree);
  }
}

function upgradeStorybookPackagesInPackageJson(tree: Tree) {
  /**
   * Should upgrade all @storybook/* packages in package.json
   */

  return maybeUpdateVersion(tree);
}

function moveOldFiles(tree: Tree, configFolderDir: string) {
  moveDirectory(
    tree,
    configFolderDir,
    configFolderDir.replace('.storybook', '.old_storybook')
  );
}

function migrateProjectLevelStorybookInstance(
  tree: Tree,
  projectName: string,
  uiFramework: StorybookConfigureSchema['uiFramework'],
  configFolder: string
) {
  const old_folder_exists_already = tree.exists(
    configFolder?.replace('.storybook', '.old_storybook')
  );
  const new_config_exists_already = tree.exists(`${configFolder}/main.js`);

  if (old_folder_exists_already || new_config_exists_already) {
    return;
  }

  moveOldFiles(tree, configFolder);

  if (tree.exists(configFolder)) {
    return;
  }

  const { projectType, targets, root } = readProjectConfiguration(
    tree,
    projectName
  );
  const { nextBuildTarget, compiler } =
    findStorybookAndBuildTargetsAndCompiler(targets);

  const mainDir =
    !!nextBuildTarget && projectType === 'application' ? 'components' : 'src';

  createProjectStorybookDir(
    tree,
    projectName,
    uiFramework,
    false,
    false,
    root,
    projectType,
    false,
    mainDir,
    !!nextBuildTarget,
    compiler === 'swc'
  );
}

export function moveDirectory(tree: Tree, from: string, to: string) {
  visitNotIgnoredFiles(tree, from, (file) => {
    tree.rename(file, file.replace(from, to));
  });
}
