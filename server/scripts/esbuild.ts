import { ChildProcess, spawn } from 'child_process';
import esbuild from 'esbuild';
import type { Plugin, PluginBuild } from 'esbuild';

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
    plugins: isDev ? [createRestartPlugin()] : [],
    external: ['argon2'],
  });

  if (isDev) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

runBuild().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
