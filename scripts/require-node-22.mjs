const nodeMajor = Number(process.versions.node.split('.')[0]);

if (nodeMajor !== 22) {
  throw new Error(`Desktop packaging requires Node.js 22; received ${process.versions.node}.`);
}
