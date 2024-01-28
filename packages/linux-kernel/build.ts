import { $ } from "bun";
import os from "os";
import chalk from "chalk";
import { constantCase } from "change-case";

// TODO: See https://github.com/colinhacks/zod/pull/1786
//const configSchema = z.record(z.literal("CONFIG_").and(z.string()), z.boolean().or(z.string()));

const configFile = Bun.env.LINUX_CONFIG ?? "./kernel.config.ts";

let configContent = "";
let importedConfig: Record<string, string | boolean> = {};
let config: Record<string, string | boolean> = {};

try {
	importedConfig = await import(configFile);
	config = importedConfig.default as unknown as Record<string, string | boolean>;

	configContent = Object.entries(config)
		.map(([key, value]) => {
			if (value == true) return `${constantCase(key)}=y`;
			else if (value == false) return `# CONFIG_${constantCase(key)} is not set`;
			else return `${constantCase(key)}=${value}`;
		})
		.join("\n");
} catch (error) {
	console.error(chalk.red("An unexpected error occurred:", error));

	process.exit(1);
}

const arch = importedConfig.arch ?? "x86";
const enableLLVM = importedConfig.llvm;

const start = Date.now();

console.log(chalk.greenBright("🚚 Fetching kernel sources (this may take a while)..."));
await $`git clone --depth=1 https://kernel.googlesource.com/pub/scm/linux/kernel/git/torvalds/linux`;

await $`cd linux && echo ${configContent ?? ""} > .config`;
await $`cd linux && make -j${os.cpus().length} ARCH=${arch as string} ${enableLLVM ? "LLVM=1" : ""} olddefconfig`;

console.log(chalk.greenBright("🔥 Building the linux kernel..."));
await $`cd linux && make -j${os.cpus().length} ARCH=${arch as string} ${enableLLVM ? "LLVM=1" : ""}`;

console.log(chalk.greenBright("Installing the kernel to out..."));
await $`mkdir -p out && cd linux && make -j${os.cpus().length} ARCH=${arch as string} ${enableLLVM ? "LLVM=1" : ""} install modules_install headers_install INSTALL_HDR_PATH=${process.cwd()}/out INSTALL_MOD_PATH=${process.cwd()}/out INSTALL_PATH=${process.cwd()}/out`;

console.log(chalk.greenBright(`✨ Done in ${Date.now() - start}ms`));
