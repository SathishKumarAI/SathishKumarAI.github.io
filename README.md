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

## The one thing to change later

`SOURCE_REF` at the top of the workflow is currently
`redesign/highway-premium`, because that branch carries the current site and
`main` does not yet. **Set it to `main` once Personal-Portfolio PR #4 is
squash-merged.** It is one line, and it is the only piece of this repo that goes
stale.

## License

[MIT](LICENSE), matching the source repository. Note that this repo contains no
site code and no content: the licence here covers the deploy workflow only. The
site's own content is covered by the License section of
[Personal-Portfolio](https://github.com/SathishKumarAI/Personal-Portfolio#license),
which reserves the written material and images.
