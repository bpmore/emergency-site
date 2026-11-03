const htmlmin = require('html-minifier-terser')

module.exports = {
    htmlmin: async function(content, outputPath) {
        if (
            outputPath &&
            outputPath.endsWith('.html') &&
            process.env.NODE_ENV === 'production'
        ) {
            return await htmlmin.minify(content, {
                useShortDoctype: true,
                removeComments: true,
                collapseWhitespace: true
            })
        }
        return content
    }
}
