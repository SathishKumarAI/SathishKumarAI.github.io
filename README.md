# SathishKumarAI.github.io

**This repo holds no site code.** It is a deploy target, and it exists for one
reason: only a repo named exactly `<user>.github.io` is served from the domain
root. Any other repo would be served from a subpath, which would force Vite's
`base` away from `/` and split the build into two modes, one for Pages and one
for Vercel.

Source of truth: **[SathishKumarAI/Personal-Portfolio](https://github.com/SathishKumarAI/Personal-Portfolio)**,
in the `3d_portfolio/` subdirectory. Edit there, never here.

Live at <https://sathishkumarai.github.io/>

## How a deploy happens

`.github/workflows/deploy.yml` checks out the source repo, runs
`npm ci && npm run build` in `3d_portfolio/`, and publishes `dist/` to Pages.
Nothing is built from this repo's own contents, and no build output is committed
here.

Because the source lives in another repository, a push there **cannot** trigger
this workflow. Deploys run:

- on push to this repo's `main` (which is effectively only workflow edits), and
- on demand: `gh workflow run deploy.yml -R SathishKumarAI/SathishKumarAI.github.io`

## Which ref it builds

`SOURCE_REF` at the top of the workflow is `main`. It pointed at
`redesign/highway-premium` while that branch carried the site and `main` did
not; PR #4 squash-merged on 2026-09-12 as `630a38f` and it was flipped in the
same pass.

## License

[MIT](LICENSE), matching the source repository. Note that this repo contains no
site code and no content: the licence here covers the deploy workflow only. The
site's own content is covered by the License section of
[Personal-Portfolio](https://github.com/SathishKumarAI/Personal-Portfolio#license),
which reserves the written material and images.
