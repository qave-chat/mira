import { Plugin, Rule, RuleContext, Diagnostic } from "effect-oxlint";
import { Effect } from "effect";
import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Skill-reference helper
//
// Every lint message appends "see: <path>" pointing at the nearest skill
// doc. The skill is chosen by file prefix + containing app, so the reader
// always has a breadcrumb from the error back to the house rules.
// ---------------------------------------------------------------------------

const CLIENT_UI_SKILLS = {
  uiStory: "apps/client-ui/src/shared/ui/ui.story.skill.md",
  ui: "apps/client-ui/src/shared/ui/ui.skill.md",
  moduleUi: "apps/client-ui/src/module/module.ui.skill.md",
  moduleUiStory: "apps/client-ui/src/module/module.ui.story.skill.md",
  hook: "apps/client-ui/src/shared/hook/hook.skill.md",
  util: "apps/client-ui/src/shared/util/util.skill.md",
  route: "apps/client-ui/src/module/module.route.skill.md",
  atom: "apps/client-ui/src/module/module.atom.skill.md",
  module: "apps/client-ui/src/module/module.skill.md",
};

const SERVER_CORE_SKILLS = {
  rpc: "apps/server-core/src/module/module.rpc.skill.md",
  serviceTest: "apps/server-core/src/module/module.service-test.skill.md",
  service: "apps/server-core/src/module/module.service.skill.md",
  repo: "apps/server-core/src/module/module.repo.skill.md",
  schema: "apps/server-core/src/module/module.schema.skill.md",
  table: "apps/server-core/src/module/module.table.skill.md",
  util: "apps/server-core/src/module/module.util.skill.md",
  module: "apps/server-core/src/module/module.skill.md",
};

function utilSkillPath(fname) {
  return fname.replace(/\\/g, "/").includes("/apps/server-core/")
    ? SERVER_CORE_SKILLS.util
    : CLIENT_UI_SKILLS.util;
}

function relatedSkillPath(fname) {
  const base = path.basename(fname);
  const norm = fname.replace(/\\/g, "/");
  if (norm.includes("/apps/client-ui/")) {
    const isModuleUi = /\/apps\/client-ui\/src\/module\/[^/]+\/ui\//.test(norm);
    if (/\.ui\.story\.tsx?$/.test(base)) {
      return isModuleUi ? CLIENT_UI_SKILLS.moduleUiStory : CLIENT_UI_SKILLS.uiStory;
    }
    if (/\.ui\.tsx?$/.test(base)) {
      return isModuleUi ? CLIENT_UI_SKILLS.moduleUi : CLIENT_UI_SKILLS.ui;
    }
    if (/\.hook\.tsx?$/.test(base)) return CLIENT_UI_SKILLS.hook;
    if (/\.util\.tsx?$/.test(base)) return CLIENT_UI_SKILLS.util;
    if (/\.route\.tsx?$/.test(base)) return CLIENT_UI_SKILLS.route;
    if (/\.atom(-[a-z]+)?\.tsx?$/.test(base)) return CLIENT_UI_SKILLS.atom;
    return CLIENT_UI_SKILLS.module;
  }
  if (norm.includes("/apps/server-core/")) {
    if (base.endsWith(".service.test.ts")) return SERVER_CORE_SKILLS.serviceTest;
    if (/\.rpc\.(contract|impl)\.ts$/.test(base)) return SERVER_CORE_SKILLS.rpc;
    if (base.endsWith(".service.ts")) return SERVER_CORE_SKILLS.service;
    if (base.endsWith(".repo.ts")) return SERVER_CORE_SKILLS.repo;
    if (base.endsWith(".schema.ts")) return SERVER_CORE_SKILLS.schema;
    if (base.endsWith(".table.ts")) return SERVER_CORE_SKILLS.table;
    if (/\.util\.tsx?$/.test(base)) return SERVER_CORE_SKILLS.util;
    return SERVER_CORE_SKILLS.module;
  }
  return null;
}

// Companion rules point at the test / story skill (not the source skill) so
// the reader lands on the conventions for the file they need to create.
function companionTestSkill(fname) {
  const base = path.basename(fname);
  const norm = fname.replace(/\\/g, "/");
  if (norm.includes("/apps/server-core/")) {
    if (base.endsWith(".service.ts")) {
      return SERVER_CORE_SKILLS.serviceTest;
    }
  }
  return relatedSkillPath(fname);
}

function withSkill(fname, message, override) {
  const skill = override ?? relatedSkillPath(fname);
  return skill == null ? message : `${message} — see: ${skill}`;
}

function reportWithSkill(ctx, node, message, override) {
  return ctx.report(
    Diagnostic.make({
      node,
      message: withSkill(ctx.filename, message, override),
    }),
  );
}

// ---------------------------------------------------------------------------
// Effect discipline rules
// ---------------------------------------------------------------------------

const banCallableRule = (name, description, match, message) =>
  Rule.define({
    name,
    meta: Rule.meta({ type: "suggestion", description }),
    create: function* () {
      const ctx = yield* RuleContext;
      return {
        ThrowStatement: (node) =>
          match.throwStmt ? reportWithSkill(ctx, node, message) : Effect.void,
        MemberExpression: (node) => {
          if (!match.member) return Effect.void;
          if (
            node.object &&
            node.object.type === "Identifier" &&
            node.object.name === match.member.obj &&
            node.property &&
            node.property.type === "Identifier" &&
            match.member.props.includes(node.property.name)
          ) {
            return reportWithSkill(ctx, node, message);
          }
          return Effect.void;
        },
        NewExpression: (node) => {
          if (!match.newExpr) return Effect.void;
          if (
            node.callee &&
            node.callee.type === "Identifier" &&
            node.callee.name === match.newExpr
          ) {
            return reportWithSkill(ctx, node, message);
          }
          return Effect.void;
        },
      };
    },
  });

const noThrow = banCallableRule(
  "no-throw",
  "Use Effect.fail / Effect.die instead of throw",
  { throwStmt: true },
  "Use Effect.fail / Effect.die instead of throw",
);

const noMathRandom = banCallableRule(
  "no-math-random",
  "Use the Effect Random service instead of Math.random",
  { member: { obj: "Math", props: ["random"] } },
  "Use the Effect Random service instead of Math.random",
);

const noNewDate = banCallableRule(
  "no-new-date",
  "Use the Clock / DateTime service instead of new Date()",
  { newExpr: "Date" },
  "Use the Clock / DateTime service instead of new Date()",
);

const noJsonParse = banCallableRule(
  "no-json-parse",
  "Use Schema.decodeUnknown / Schema.encode instead of JSON.parse / stringify",
  { member: { obj: "JSON", props: ["parse", "stringify"] } },
  "Use Schema.decodeUnknown / Schema.encode instead of JSON.parse / stringify",
);

// ---------------------------------------------------------------------------
// File-naming rules
// ---------------------------------------------------------------------------

const fileNameRule = (name, description, check, skillOverride) =>
  Rule.define({
    name,
    meta: Rule.meta({ type: "problem", description }),
    create: function* () {
      const ctx = yield* RuleContext;
      return {
        Program: (node) => {
          const base = path.basename(ctx.filename);
          if (/\.test\.tsx?$/.test(base)) return Effect.void;
          if (/\.story\.tsx?$/.test(base)) return Effect.void;
          if (base.endsWith(".skill.md")) return Effect.void;
          const message = check(base);
          if (message === null) return Effect.void;
          return reportWithSkill(ctx, node, message, skillOverride);
        },
      };
    },
  });

const requireUiSuffix = fileNameRule(
  "require-ui-suffix",
  "Presentational components must be named <name>.ui.tsx",
  (base) =>
    /\.ui\.tsx?$/.test(base)
      ? null
      : `"${base}" must end with .ui.tsx — files here must be pure presentation (no state, no effects). Move logic to a hook / provider / module.`,
  CLIENT_UI_SKILLS.ui,
);

const requireHookSuffix = fileNameRule(
  "require-hook-suffix",
  "Hook files must be named use-<name>.hook.ts(x)",
  (base) =>
    /^use-[A-Za-z0-9-]+\.hook\.tsx?$/.test(base)
      ? null
      : `"${base}" must match use-<name>.hook.ts(x)`,
  CLIENT_UI_SKILLS.hook,
);

const requireUtilSuffix = fileNameRule(
  "require-util-suffix",
  "Utility files must be named <name>.util.ts",
  (base) => (/\.util\.tsx?$/.test(base) ? null : `"${base}" must end with .util.ts`),
  CLIENT_UI_SKILLS.util,
);

// ---------------------------------------------------------------------------
// Content rules
// ---------------------------------------------------------------------------

const utilExportsOnlyFunctions = Rule.define({
  name: "util-exports-only-functions",
  meta: Rule.meta({
    type: "problem",
    description: "Util files may only export functions",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const report = (node) =>
      reportWithSkill(
        ctx,
        node,
        "util files may only export functions — move values/classes to a module or atom",
        utilSkillPath(ctx.filename),
      );
    const isFnInit = (init) =>
      init != null &&
      (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression");
    return {
      ExportNamedDeclaration: (node) => {
        if (node.declaration == null) {
          if (node.specifiers && node.specifiers.length > 0) return report(node);
          return Effect.void;
        }
        const d = node.declaration;
        if (d.type === "FunctionDeclaration") return Effect.void;
        if (d.type === "VariableDeclaration") {
          for (const decl of d.declarations) {
            if (!isFnInit(decl.init)) return report(node);
          }
          return Effect.void;
        }
        return report(node);
      },
      ExportDefaultDeclaration: (node) => {
        const d = node.declaration;
        if (
          d.type === "FunctionDeclaration" ||
          d.type === "ArrowFunctionExpression" ||
          d.type === "FunctionExpression"
        ) {
          return Effect.void;
        }
        return report(node);
      },
    };
  },
});

const utilTestCoversAllExports = Rule.define({
  name: "util-test-covers-all-exports",
  meta: Rule.meta({
    type: "problem",
    description:
      "Every exported util function must be covered by a describe() block in the companion test",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const fname = ctx.filename;
    if (!/\.util\.tsx?$/.test(fname)) return {};
    const ext = fname.endsWith(".tsx") ? ".tsx" : ".ts";
    const testPath = fname.slice(0, -`.util${ext}`.length) + `.util.test${ext}`;
    if (!fs.existsSync(testPath)) return {};
    const testSrc = fs.readFileSync(testPath, "utf8");
    const covers = (name) => new RegExp(`describe\\(\\s*["'\`]${name}\\b`).test(testSrc);
    const reportMissing = (node, name) =>
      reportWithSkill(
        ctx,
        node,
        `util export "${name}" has no describe("${name}", ...) block in ${path.basename(testPath)}`,
        utilSkillPath(ctx.filename),
      );
    return {
      ExportNamedDeclaration: (node) => {
        const d = node.declaration;
        if (d == null) return Effect.void;
        if (d.type === "FunctionDeclaration" && d.id != null) {
          if (!covers(d.id.name)) return reportMissing(node, d.id.name);
          return Effect.void;
        }
        if (d.type === "VariableDeclaration") {
          for (const decl of d.declarations) {
            if (decl.id.type === "Identifier" && !covers(decl.id.name)) {
              return reportMissing(node, decl.id.name);
            }
          }
        }
        return Effect.void;
      },
    };
  },
});

const utilExportObjectParams = Rule.define({
  name: "util-export-object-params",
  meta: Rule.meta({
    type: "problem",
    description: "Exported util functions must take exactly one object parameter",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    if (!/\.util\.tsx?$/.test(ctx.filename)) return {};
    const report = (node, name) =>
      reportWithSkill(
        ctx,
        node,
        `util export "${name}" must take exactly one object parameter`,
        utilSkillPath(ctx.filename),
      );
    const hasOneObjectParam = (fn) => {
      if (fn.params == null || fn.params.length !== 1) return false;
      const param = fn.params[0];
      return param.type === "ObjectPattern";
    };
    const checkFn = (node, name, fn) => (hasOneObjectParam(fn) ? Effect.void : report(node, name));
    return {
      ExportNamedDeclaration: (node) => {
        const d = node.declaration;
        if (d == null) return Effect.void;
        if (d.type === "FunctionDeclaration" && d.id != null) {
          return checkFn(node, d.id.name, d);
        }
        if (d.type === "VariableDeclaration") {
          for (const decl of d.declarations) {
            if (decl.id.type !== "Identifier") continue;
            const init = decl.init;
            if (
              init != null &&
              (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression")
            ) {
              if (!hasOneObjectParam(init)) return report(node, decl.id.name);
            }
          }
        }
        return Effect.void;
      },
    };
  },
});

const hookExportsUsePrefix = Rule.define({
  name: "hook-exports-use-prefix",
  meta: Rule.meta({
    type: "problem",
    description: "Hook files may only export identifiers prefixed with `use`",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const report = (node, name) =>
      reportWithSkill(
        ctx,
        node,
        `hook export "${name}" must start with "use" — non-hook values belong in a util or module`,
        CLIENT_UI_SKILLS.hook,
      );
    const checkName = (node, name) => (name.startsWith("use") ? Effect.void : report(node, name));
    return {
      ExportNamedDeclaration: (node) => {
        if (node.declaration == null) {
          for (const s of node.specifiers ?? []) {
            if (s.exported.type === "Identifier") {
              if (!s.exported.name.startsWith("use")) {
                return report(node, s.exported.name);
              }
            }
          }
          return Effect.void;
        }
        const d = node.declaration;
        if (d.type === "FunctionDeclaration" && d.id != null) {
          return checkName(node, d.id.name);
        }
        if (d.type === "VariableDeclaration") {
          for (const decl of d.declarations) {
            if (decl.id.type === "Identifier") {
              if (!decl.id.name.startsWith("use")) {
                return report(node, decl.id.name);
              }
            }
          }
          return Effect.void;
        }
        return Effect.void;
      },
    };
  },
});

// ---------------------------------------------------------------------------
// Companion file rules
// ---------------------------------------------------------------------------

const TEST_SUFFIXES = [
  [".hook.tsx", ".hook.test.tsx"],
  [".hook.ts", ".hook.test.ts"],
  [".util.tsx", ".util.test.tsx"],
  [".util.ts", ".util.test.ts"],
  [".atom.tsx", ".atom.test.tsx"],
  [".atom.ts", ".atom.test.ts"],
  [".service.ts", ".service.test.ts"],
];

const requireCompanionTest = Rule.define({
  name: "require-companion-test",
  meta: Rule.meta({
    type: "problem",
    description: "Every prefixed source file must have a co-located .test.ts(x) sibling",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    return {
      Program: (node) => {
        const fname = ctx.filename;
        if (/\.test\.tsx?$/.test(fname)) return Effect.void;
        for (const [src, test] of TEST_SUFFIXES) {
          if (!fname.endsWith(src)) continue;
          const testPath = fname.slice(0, -src.length) + test;
          if (fs.existsSync(testPath)) return Effect.void;
          return reportWithSkill(
            ctx,
            node,
            `missing companion test: ${path.basename(testPath)} (must sit next to ${path.basename(fname)})`,
            companionTestSkill(fname),
          );
        }
        return Effect.void;
      },
    };
  },
});

const requireCompanionStory = Rule.define({
  name: "require-companion-story",
  meta: Rule.meta({
    type: "problem",
    description:
      "Every .ui.tsx component (shared/ui/* or module/*/ui/*) must have a co-located .ui.story.tsx sibling",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    return {
      Program: (node) => {
        const fname = ctx.filename;
        if (!/\.ui\.tsx?$/.test(fname)) return Effect.void;
        if (/\.ui\.story\.tsx?$/.test(fname)) return Effect.void;
        if (/\.ui\.test\.tsx?$/.test(fname)) return Effect.void;
        const normalized = fname.replace(/\\/g, "/");
        const isSharedUi = normalized.includes("/shared/ui/");
        const isModuleUi = /\/apps\/client-ui\/src\/module\/[^/]+\/ui\//.test(normalized);
        if (!isSharedUi && !isModuleUi) return Effect.void;
        const ext = fname.endsWith(".tsx") ? ".tsx" : ".ts";
        const src = `.ui${ext}`;
        const story = `.ui.story${ext}`;
        const storyPath = fname.slice(0, -src.length) + story;
        if (fs.existsSync(storyPath)) return Effect.void;
        return reportWithSkill(
          ctx,
          node,
          `missing companion story: ${path.basename(storyPath)} (must sit next to ${path.basename(fname)})`,
          isModuleUi ? CLIENT_UI_SKILLS.moduleUiStory : CLIENT_UI_SKILLS.uiStory,
        );
      },
    };
  },
});

// ---------------------------------------------------------------------------
// Layer handler observability rule
//
// Every method returned from `Layer.effect(X, Effect.gen(...))` or
// `<Group>.toLayer(Effect.gen(...))` in a *.repo.impl.ts / *.service.impl.ts
// / *.rpc.impl.ts file must be wrapped in `Effect.fn("<Layer>.<op>")` so
// each operation becomes its own span. Plain arrow/generator values or
// shorthand properties are flagged.
// ---------------------------------------------------------------------------

const isEffectMember = (node, prop) =>
  node != null &&
  node.type === "MemberExpression" &&
  node.object != null &&
  node.object.type === "Identifier" &&
  node.object.name === "Effect" &&
  node.property != null &&
  node.property.type === "Identifier" &&
  node.property.name === prop;

const isEffectGenCall = (node) =>
  node != null && node.type === "CallExpression" && isEffectMember(node.callee, "gen");

const isEffectFnWrappedValue = (node) => {
  if (node == null || node.type !== "CallExpression") return false;
  const inner = node.callee;
  if (inner == null || inner.type !== "CallExpression") return false;
  return isEffectMember(inner.callee, "fn");
};

const isDotOfCall = (node) =>
  node != null &&
  node.type === "CallExpression" &&
  node.callee != null &&
  node.callee.type === "MemberExpression" &&
  node.callee.property != null &&
  node.callee.property.type === "Identifier" &&
  node.callee.property.name === "of";

const findReturnArgument = (genCall) => {
  const fn = genCall.arguments && genCall.arguments[0];
  if (fn == null) return null;
  if (fn.type !== "FunctionExpression" && fn.type !== "ArrowFunctionExpression") {
    return null;
  }
  const body = fn.body;
  if (body == null || body.type !== "BlockStatement") return null;
  for (const stmt of body.body) {
    if (stmt.type === "ReturnStatement") return stmt.argument;
  }
  return null;
};

const propertyLabel = (prop) => {
  if (prop.key == null) return "<anon>";
  if (prop.key.type === "Identifier") return prop.key.name;
  if (prop.key.type === "Literal") return String(prop.key.value);
  return "<computed>";
};

const collectEffectFnBindings = (genCall) => {
  const names = new Set();
  const fn = genCall.arguments && genCall.arguments[0];
  if (fn == null) return names;
  if (fn.type !== "FunctionExpression" && fn.type !== "ArrowFunctionExpression") {
    return names;
  }
  const body = fn.body;
  if (body == null || body.type !== "BlockStatement") return names;
  for (const stmt of body.body) {
    if (stmt.type !== "VariableDeclaration") continue;
    for (const decl of stmt.declarations) {
      if (decl.id == null || decl.id.type !== "Identifier") continue;
      if (isEffectFnWrappedValue(decl.init)) names.add(decl.id.name);
    }
  }
  return names;
};

const requireEffectFnHandlers = Rule.define({
  name: "require-effect-fn-handlers",
  meta: Rule.meta({
    type: "suggestion",
    description:
      'Methods returned from Layer.effect / Group.toLayer must use Effect.fn("<Layer>.<op>") for span tracing',
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    const base = path.basename(ctx.filename);
    if (!/\.(repo|service|rpc)\.impl\.ts$/.test(base)) return {};

    const checkObject = (obj, bindings) => {
      if (obj == null || obj.type !== "ObjectExpression") return Effect.void;
      const reports = [];
      for (const prop of obj.properties) {
        if (prop.type !== "Property") continue;
        const value = prop.value;
        if (value != null && value.type === "Identifier") {
          if (!bindings.has(value.name)) {
            reports.push(
              reportWithSkill(
                ctx,
                prop,
                `handler "${propertyLabel(prop)}" must resolve to an Effect.fn("<Layer>.<op>")(function* ...) binding for span tracing`,
              ),
            );
          }
          continue;
        }
        if (!isEffectFnWrappedValue(value)) {
          reports.push(
            reportWithSkill(
              ctx,
              prop,
              `handler "${propertyLabel(prop)}" must use Effect.fn("<Layer>.<op>")(function* ...) for span tracing`,
            ),
          );
        }
      }
      if (reports.length === 0) return Effect.void;
      return Effect.all(reports, { discard: true });
    };

    return {
      CallExpression: (node) => {
        const callee = node.callee;
        if (callee == null || callee.type !== "MemberExpression") {
          return Effect.void;
        }
        const prop = callee.property;
        if (prop == null || prop.type !== "Identifier") return Effect.void;
        const isLayerEffect =
          callee.object != null &&
          callee.object.type === "Identifier" &&
          callee.object.name === "Layer" &&
          prop.name === "effect";
        const isToLayer = prop.name === "toLayer";
        if (!isLayerEffect && !isToLayer) return Effect.void;
        const genCall = isLayerEffect
          ? node.arguments && node.arguments[1]
          : node.arguments && node.arguments[0];
        if (!isEffectGenCall(genCall)) return Effect.void;
        const retExpr = findReturnArgument(genCall);
        if (retExpr == null) return Effect.void;
        const obj = isDotOfCall(retExpr) ? retExpr.arguments && retExpr.arguments[0] : retExpr;
        const bindings = collectEffectFnBindings(genCall);
        return checkObject(obj, bindings);
      },
    };
  },
});

// ---------------------------------------------------------------------------
// Tagged-error naming rule
//
// `class <Name> extends Schema.TaggedErrorClass<<Name>>()(<tag>, {...}) {}`
// must satisfy:
//   - <Name> starts with `Error` (and has at least one more PascalCase
//     segment, e.g. `ErrorDb`, `ErrorSessionNotFound`).
//   - <tag> string literal equals <Name> so the wire discriminator
//     matches the class identifier.
// ---------------------------------------------------------------------------

const ERROR_NAME_RE = /^Error[A-Z][A-Za-z0-9]*$/;

const isSchemaTaggedErrorClassCall = (node) => {
  // Matches: Schema.TaggedErrorClass<Self>()
  if (node == null || node.type !== "CallExpression") return false;
  const inner = node.callee;
  if (inner == null || inner.type !== "CallExpression") return false;
  if (inner.arguments && inner.arguments.length !== 0) return false;
  const member = inner.callee;
  if (member == null || member.type !== "MemberExpression") return false;
  if (member.object == null || member.object.type !== "Identifier") return false;
  if (member.object.name !== "Schema") return false;
  if (member.property == null || member.property.type !== "Identifier") return false;
  return member.property.name === "TaggedErrorClass";
};

const getStringLiteral = (node) => {
  if (node == null) return null;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  return null;
};

const taggedErrorName = Rule.define({
  name: "tagged-error-name",
  meta: Rule.meta({
    type: "problem",
    description:
      "Tagged-error classes must be named Error<Entity><Reason> and the tag string must equal the class name",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    return {
      ClassDeclaration: (node) => {
        const superClass = node.superClass;
        if (!isSchemaTaggedErrorClassCall(superClass)) return Effect.void;
        const className = node.id && node.id.type === "Identifier" ? node.id.name : null;
        const tag = getStringLiteral(superClass.arguments && superClass.arguments[0]);
        const reports = [];
        if (className == null || !ERROR_NAME_RE.test(className)) {
          reports.push(
            reportWithSkill(
              ctx,
              node,
              `tagged-error class "${className ?? "<anon>"}" must be named Error<Entity><Reason> (e.g. ErrorDb, ErrorSessionNotFound)`,
            ),
          );
        }
        if (className != null && tag != null && tag !== className) {
          reports.push(
            reportWithSkill(
              ctx,
              node,
              `tagged-error tag "${tag}" must equal class name "${className}" — the tag is the wire discriminator`,
            ),
          );
        }
        if (reports.length === 0) return Effect.void;
        return Effect.all(reports, { discard: true });
      },
    };
  },
});

// ---------------------------------------------------------------------------
// Prefer pipe form for catchTag / catchTags
//
// `Effect.catchTag(subject, tag, handler)` (data-first) hides the subject
// inside the call and nests badly as the chain grows. Require the pipe
// form `subject.pipe(Effect.catchTag(tag, handler))` instead. The dual
// call signature stays legal — the lint just steers the style.
// ---------------------------------------------------------------------------

const PIPEABLE_METHODS = new Set(["catchTag", "catchTags"]);

// ---------------------------------------------------------------------------
// Prefer Effect.catchTags({ Tag: handler }) over Effect.catchTag("Tag", handler)
//
// The object form reads consistently whether you handle one tag or ten,
// and growing from one branch to two doesn't require changing the
// combinator name.
// ---------------------------------------------------------------------------

const preferCatchTags = Rule.define({
  name: "prefer-catch-tags",
  meta: Rule.meta({
    type: "suggestion",
    description:
      'Use Effect.catchTags({ Tag: handler }) instead of Effect.catchTag("Tag", handler)',
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    return {
      CallExpression: (node) => {
        const callee = node.callee;
        if (callee == null || callee.type !== "MemberExpression") return Effect.void;
        if (callee.object == null || callee.object.type !== "Identifier") return Effect.void;
        if (callee.object.name !== "Effect") return Effect.void;
        if (callee.property == null || callee.property.type !== "Identifier") {
          return Effect.void;
        }
        if (callee.property.name !== "catchTag") return Effect.void;
        return reportWithSkill(
          ctx,
          node,
          'use Effect.catchTags({ Tag: handler }) instead of Effect.catchTag("Tag", handler) — the object form stays consistent as you add more tags',
        );
      },
    };
  },
});

const preferPipeCatch = Rule.define({
  name: "prefer-pipe-catch",
  meta: Rule.meta({
    type: "suggestion",
    description:
      "Use subject.pipe(Effect.catchTag(tag, handler)) instead of the data-first Effect.catchTag(subject, tag, handler)",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    return {
      CallExpression: (node) => {
        const callee = node.callee;
        if (callee == null || callee.type !== "MemberExpression") return Effect.void;
        if (callee.object == null || callee.object.type !== "Identifier") return Effect.void;
        if (callee.object.name !== "Effect") return Effect.void;
        if (callee.property == null || callee.property.type !== "Identifier") {
          return Effect.void;
        }
        const method = callee.property.name;
        if (!PIPEABLE_METHODS.has(method)) return Effect.void;
        // Data-last (pipe) calls have 1-2 args (tag + handler). Data-first
        // calls pass the subject Effect as the first arg → 3+ args.
        const argCount = node.arguments ? node.arguments.length : 0;
        if (argCount < 3) return Effect.void;
        return reportWithSkill(
          ctx,
          node,
          `use subject.pipe(Effect.${method}(...)) instead of Effect.${method}(subject, ...) — pipe form scales as the chain grows`,
        );
      },
    };
  },
});

// ---------------------------------------------------------------------------
// Prefer Promise.try(() => ...) over try { await ... } catch
//
// `Promise.try(fn)` runs `fn` and captures both sync throws and rejected
// promises into a single chainable Promise — no need for an outer
// `try { await ... } catch` to glue the two error channels together.
// This rule flags `try` blocks that contain an `await`; pure-sync
// try/catch is left alone.
// ---------------------------------------------------------------------------

const FN_BOUNDARY_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

const blockContainsAwait = (node) => {
  if (node == null || typeof node !== "object" || node.type == null) return false;
  if (node.type === "AwaitExpression") return true;
  if (FN_BOUNDARY_TYPES.has(node.type)) return false;
  for (const key of Object.keys(node)) {
    if (key === "parent" || key === "loc" || key === "range") continue;
    const child = node[key];
    if (child == null) continue;
    if (Array.isArray(child)) {
      for (const c of child) {
        if (blockContainsAwait(c)) return true;
      }
    } else if (typeof child === "object" && child.type != null) {
      if (blockContainsAwait(child)) return true;
    }
  }
  return false;
};

// ---------------------------------------------------------------------------
// Prefer `useAtomSet(atom, { mode: "promiseExit" })`
//
// `mode: "promiseExit"` returns an `Exit<A, E>` that lets callers branch on
// `Exit.isSuccess` / `Exit.isFailure` without try/catch and without losing
// the typed error channel. Other modes (default "promise", "promiseResult",
// "effect") make error handling uneven across callsites. This rule requires
// an explicit `{ mode: "promiseExit" }` options arg on every useAtomSet call.
// ---------------------------------------------------------------------------

const getObjectProperty = (obj, name) => {
  if (obj == null || obj.type !== "ObjectExpression") return null;
  for (const p of obj.properties) {
    if (p.type !== "Property") continue;
    if (p.key == null) continue;
    if (p.key.type === "Identifier" && p.key.name === name) return p;
    if (p.key.type === "Literal" && p.key.value === name) return p;
  }
  return null;
};

// Only fire when the atom arg is `<Ident>.mutation(...)` or `<Ident>.query(...)`
// — those return AsyncResult atoms where `mode: "promiseExit"` is meaningful.
// Plain `Atom.make(value)` state atoms accept `mode: "value"` only, so the
// lint leaves them alone.
const isAsyncAtomFactoryCall = (node) => {
  if (node == null || node.type !== "CallExpression") return false;
  const callee = node.callee;
  if (callee == null || callee.type !== "MemberExpression") return false;
  if (callee.property == null || callee.property.type !== "Identifier") {
    return false;
  }
  return callee.property.name === "mutation" || callee.property.name === "query";
};

const preferPromiseExit = Rule.define({
  name: "prefer-promise-exit",
  meta: Rule.meta({
    type: "suggestion",
    description:
      'useAtomSet on a mutation/query atom must pass { mode: "promiseExit" } so callers branch on Exit.isSuccess',
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    return {
      CallExpression: (node) => {
        const callee = node.callee;
        if (callee == null || callee.type !== "Identifier") return Effect.void;
        if (callee.name !== "useAtomSet") return Effect.void;
        const atomArg = node.arguments && node.arguments[0];
        if (!isAsyncAtomFactoryCall(atomArg)) return Effect.void;
        const opts = node.arguments && node.arguments[1];
        const message =
          'useAtomSet on a mutation/query atom must pass { mode: "promiseExit" } — then branch on Exit.isSuccess / Exit.isFailure instead of try/catch';
        if (opts == null) return reportWithSkill(ctx, node, message);
        const modeProp = getObjectProperty(opts, "mode");
        if (modeProp == null) return reportWithSkill(ctx, node, message);
        const v = modeProp.value;
        if (v == null || v.type !== "Literal" || v.value !== "promiseExit") {
          return reportWithSkill(ctx, modeProp, message);
        }
        return Effect.void;
      },
    };
  },
});

// ---------------------------------------------------------------------------
// Ban Atom.searchParam — use TanStack Router search params instead
//
// `Atom.searchParam` writes through `window.history.pushState` directly,
// bypassing TanStack Router's internal search-param state. TanStack's own
// navigation likewise doesn't notify the atom's listener, so the two get
// out of sync. In this repo, URL-backed state lives on the route via
// `validateSearch` + `Route.useSearch()` + `navigate({ search })`.
// ---------------------------------------------------------------------------

const noAtomSearchParam = Rule.define({
  name: "no-atom-searchparam",
  meta: Rule.meta({
    type: "problem",
    description:
      "Atom.searchParam fights TanStack Router over the URL — use validateSearch + Route.useSearch + navigate({ search }) instead",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    return {
      CallExpression: (node) => {
        const callee = node.callee;
        if (callee == null || callee.type !== "MemberExpression") return Effect.void;
        if (callee.object == null || callee.object.type !== "Identifier") return Effect.void;
        if (callee.object.name !== "Atom") return Effect.void;
        if (callee.property == null || callee.property.type !== "Identifier") {
          return Effect.void;
        }
        if (callee.property.name !== "searchParam") return Effect.void;
        return reportWithSkill(
          ctx,
          node,
          "Atom.searchParam fights TanStack Router over the URL — declare the param on the route via validateSearch and read/write with Route.useSearch() + navigate({ search })",
          "apps/client-ui/src/shared/state.skill.md",
        );
      },
    };
  },
});

// ---------------------------------------------------------------------------
// Atom files must export atoms (suffix `Atom`) or service classes
//
// Keeps .atom.ts files "data-only": every export is either an atom
// (`sessionListAtom`) or a service-class declaration like `RpcClient`.
// Helper functions / constants / types should live in a util or module.
// ---------------------------------------------------------------------------

const isAtomFile = (fname) => /\.atom(-[a-z]+)?\.tsx?$/.test(path.basename(fname));

const looksLikeAtomExport = (name) => name.endsWith("Atom") || name.endsWith("AtomFor");

const atomExportSuffix = Rule.define({
  name: "atom-export-suffix",
  meta: Rule.meta({
    type: "problem",
    description:
      "Exports from .atom.ts files must be named <name>Atom (or be a service class like RpcClient)",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    if (!isAtomFile(ctx.filename)) return {};
    const report = (node, name) =>
      reportWithSkill(
        ctx,
        node,
        `atom export "${name}" must end in "Atom" (helpers belong in a util; services in a service file)`,
        "apps/client-ui/src/shared/state.skill.md",
      );
    const checkName = (node, name) =>
      looksLikeAtomExport(name) ? Effect.void : report(node, name);
    return {
      ExportNamedDeclaration: (node) => {
        if (node.declaration == null) {
          for (const s of node.specifiers ?? []) {
            if (s.exported.type === "Identifier") {
              if (!looksLikeAtomExport(s.exported.name)) {
                return report(node, s.exported.name);
              }
            }
          }
          return Effect.void;
        }
        const d = node.declaration;
        // Allow class declarations (e.g. AtomRpc.Service subclasses like RpcClient).
        if (d.type === "ClassDeclaration") return Effect.void;
        if (d.type === "FunctionDeclaration" && d.id != null) {
          return checkName(node, d.id.name);
        }
        if (d.type === "VariableDeclaration") {
          for (const decl of d.declarations) {
            if (decl.id.type === "Identifier") {
              if (!looksLikeAtomExport(decl.id.name)) {
                return report(node, decl.id.name);
              }
            }
          }
        }
        return Effect.void;
      },
    };
  },
});

// ---------------------------------------------------------------------------
// Table timestamps must use Postgres timestamp defaults
// ---------------------------------------------------------------------------

const isTableFile = (fname) => path.basename(fname).endsWith(".table.ts");

const isBetterAuthTableFile = (fname) =>
  fname.replace(/\\/g, "/").includes("/apps/server-core/src/platform/auth/");

const propertyName = (key) => {
  if (key == null) return null;
  if (key.type === "Identifier") return key.name;
  if (key.type === "Literal") return key.value;
  return null;
};

const isMemberCall = (node, name) => {
  if (node == null || node.type !== "CallExpression") return false;
  const callee = node.callee;
  if (callee == null || callee.type !== "MemberExpression") return false;
  return callee.property?.type === "Identifier" && callee.property.name === name;
};

const isTimestampCall = (node, columnName) => {
  if (node == null || node.type !== "CallExpression") return false;
  const callee = node.callee;
  if (callee == null || callee.type !== "Identifier" || callee.name !== "timestamp") return false;
  const column = node.arguments?.[0];
  return column?.type === "Literal" && column.value === columnName;
};

const isTimestampDefaultNow = (node, columnName) => {
  if (!isMemberCall(node, "defaultNow")) return false;
  const notNullCall = node.callee.object;
  if (!isMemberCall(notNullCall, "notNull")) return false;
  return isTimestampCall(notNullCall.callee.object, columnName);
};

const requireTableTimestampDefaults = Rule.define({
  name: "require-table-timestamp-defaults",
  meta: Rule.meta({
    type: "problem",
    description:
      'createdAt and updatedAt table columns must use timestamp("created_at").notNull().defaultNow() and timestamp("updated_at").notNull().defaultNow()',
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    if (!isTableFile(ctx.filename)) return {};
    if (isBetterAuthTableFile(ctx.filename)) return {};
    return {
      Property: (node) => {
        const name = propertyName(node.key);
        if (name !== "createdAt" && name !== "updatedAt") return Effect.void;
        const columnName = name === "createdAt" ? "created_at" : "updated_at";
        if (isTimestampDefaultNow(node.value, columnName)) return Effect.void;
        return reportWithSkill(
          ctx,
          node,
          `${name} must be ${name}: timestamp("${columnName}").notNull().defaultNow()`,
          SERVER_CORE_SKILLS.table,
        );
      },
    };
  },
});

const preferPromiseTry = Rule.define({
  name: "prefer-promise-try",
  meta: Rule.meta({
    type: "suggestion",
    description:
      "Use Promise.try(() => ...) instead of try { await ... } catch — one chain handles sync throws and rejections together",
  }),
  create: function* () {
    const ctx = yield* RuleContext;
    return {
      TryStatement: (node) => {
        if (node.block != null && blockContainsAwait(node.block)) {
          return reportWithSkill(
            ctx,
            node,
            "use Promise.try(() => ...).catch(...).finally(...) instead of try { await ... } catch — Promise.try folds sync throws and rejections into one chain",
          );
        }
        return Effect.void;
      },
    };
  },
});

export default Plugin.define({
  name: "effect-local",
  rules: {
    "no-throw": noThrow,
    "no-math-random": noMathRandom,
    "no-new-date": noNewDate,
    "no-json-parse": noJsonParse,
    "require-ui-suffix": requireUiSuffix,
    "require-hook-suffix": requireHookSuffix,
    "require-util-suffix": requireUtilSuffix,
    "util-exports-only-functions": utilExportsOnlyFunctions,
    "util-test-covers-all-exports": utilTestCoversAllExports,
    "util-export-object-params": utilExportObjectParams,
    "hook-exports-use-prefix": hookExportsUsePrefix,
    "require-companion-test": requireCompanionTest,
    "require-companion-story": requireCompanionStory,
    "require-effect-fn-handlers": requireEffectFnHandlers,
    "tagged-error-name": taggedErrorName,
    "prefer-pipe-catch": preferPipeCatch,
    "prefer-catch-tags": preferCatchTags,
    "prefer-promise-try": preferPromiseTry,
    "prefer-promise-exit": preferPromiseExit,
    "no-atom-searchparam": noAtomSearchParam,
    "atom-export-suffix": atomExportSuffix,
    "require-table-timestamp-defaults": requireTableTimestampDefaults,
  },
});
