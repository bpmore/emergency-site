const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const test = require('node:test')

test('offline cache includes posts and excludes admin and error pages', () => {
    const worker = readFileSync('dist/sw.js', 'utf8')
    assert.match(worker, /url:"index.html"/)
    assert.match(worker, /url:"posts\/2020-03-22-example-post\/index.html"/)
    assert.doesNotMatch(worker, /url:"(?:admin|404)\//)
    const dependency = worker.match(/\.\/workbox-[a-f0-9]+/)[0]
    assert.ok(readFileSync(`dist/${dependency}.js`).length > 0)
})

test('production transform supports asynchronous minification without changing content', async () => {
    const { htmlmin } = require('../eleventy/transforms')
    const input = '<!doctype html><main>\n  <h1>Emergency information</h1>\n  <p>Updates remain available.</p>\n</main>'
    const result = await htmlmin(input, 'dist/fixture.html')
    assert.match(result, /<h1>Emergency information<\/h1>/)
    assert.match(result, /<p>Updates remain available\.<\/p>/)
    assert.doesNotMatch(result, /\n/)
    assert.equal(await htmlmin(input, 'dist/feed.xml'), input)
})

test('feeds and post pages retain the published content', () => {
    const page = readFileSync('dist/posts/2020-03-22-example-post/index.html', 'utf8')
    const feed = readFileSync('dist/feed.xml', 'utf8')
    assert.match(page, /<article[ >]/)
    assert.match(feed, /<updated>\d{4}-\d{2}-\d{2}T/)
    assert.match(feed, /2020-03-22-example-post/)
    assert.match(feed, /<entry>/)
})
