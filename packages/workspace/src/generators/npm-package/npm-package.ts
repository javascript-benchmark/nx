import {
  addProjectConfiguration,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  Tree,
  writeJson,
} from '@nx/devkit';
import { join } from 'path';
import { getImportPath } from '../../utilities/get-import-path';

export interface ProjectOptions {
  name: string;
}

function normalizeOptions(options: ProjectOptions): ProjectOptions {
  options.name = names(options.name).fileName;
  return options;
}

function addFiles(projectRoot: string, tree: Tree, options: ProjectOptions) {
  const packageJsonPath = join(projectRoot, 'package.json');
  writeJson(tree, packageJsonPath, {
    name: getImportPath(tree, options.name),
    version: '0.0.0',
    scripts: {
      test: 'node index.js',
    },
  });

  generateFiles(tree, join(__dirname, './files'), projectRoot, {});
}

export async function npmPackageGenerator(tree: Tree, options: ProjectOptions) {
  options = normalizeOptions(options);

  const { libsDir } = getWorkspaceLayout(tree);
  const projectRoot = join(libsDir, options.name);

  addProjectConfiguration(tree, options.name, {
    root: projectRoot,
  });

  const fileCount = tree.children(projectRoot).length;
  const projectJsonExists = tree.exists(join(projectRoot, 'project.json'));
  const isEmpty = fileCount === 0 || (fileCount === 1 && projectJsonExists);

  if (isEmpty) {
    addFiles(projectRoot, tree, options);
  }

  await formatFiles(tree);
}

export const npmPackageSchematic = convertNxGenerator(npmPackageGenerator);
