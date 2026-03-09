import { ChildProcess, exec, spawn } from 'child_process';
import esbuild from 'esbuild';
import type { Plugin, PluginBuild } from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const nodeEnv = process.env.NODE_ENV;

if (!nodeEnv || !['development', 'production'].includes(nodeEnv)) {
  console.error(
    `NODE_ENV must be set to either "development" or "production". Received: "${nodeEnv}"`,
  );
  process.exit(1);
}

const isDev = nodeEnv === 'development';

let serverProcess: ChildProcess | null = null;

function createRestartPlugin(): Plugin {
  return {
    name: 'restart-server',
    setup(build: PluginBuild) {
      build.onEnd(async (result) => {
        if (result.errors.length > 0) return;

        const proc = serverProcess;
        if (proc) {
          await new Promise<void>((resolve) => {
            proc.once('exit', resolve);
            proc.kill('SIGTERM');
          });
        }

        serverProcess = spawn('node', ['dist/index.cjs'], {
          stdio: 'inherit',
          env: { ...process.env, NODE_ENV: 'development' },
        });
      });
    },
  };
}

async function preparePlatformBinaries() {
  const distDir = path.join(process.cwd(), 'dist');
  const distPackageJsonPath = path.join(distDir, 'package.json');

  console.log('Preparing package.json in dist...');

  const packageJson = {
    dependencies: {
      argon2: await getPackageVersion('argon2'),
    },
  };

  await fs.writeFile(distPackageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log('Installing argon2 for linux-x64 in dist...');
  await execAsync('npm install --cpu=arm --os=linux', { cwd: distDir });

  console.log('Platform binaries installed successfully!');
}

async function getPackageVersion(packageName: string): Promise<string> {
  const rawContent = await fs.readFile(
    path.join(process.cwd(), 'package.json'),
    'utf-8',
  );

  const pkg = JSON.parse(rawContent) as {
    dependencies?: Record<string, string>;
  };
  const version = pkg.dependencies?.[packageName];

  if (!version) throw new Error(`${packageName} not found in package.json`);

  return version;
}

async function runBuild() {
  const ctx = await esbuild.context({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'cjs',
    outdir: 'dist',
    outExtension: { '.js': '.cjs' },
    minify: !isDev,
    sourcemap: isDev,
    treeShaking: true,
    logLevel: 'info',
    external: ['argon2'],
    plugins: isDev ? [createRestartPlugin()] : [],
  });

  if (isDev) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await preparePlatformBinaries();
    await ctx.dispose();
  }
}

runBuild().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
