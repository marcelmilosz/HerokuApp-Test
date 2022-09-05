// https://www.youtube.com/watch?v=Xm5MzWvklbI This guy helped you <3

FilePond.registerPlugin(
    FilePondPluginImagePreview,
    FilePondPluginImageResize,
    FilePondPluginFileEncode,
)

FilePond.setOptions({
    stylePanelAspectRatio: 5 / 10,
    imageResizeTargetWidth: 5,
    imageResizeTargetHeight: 10
})

FilePond.parse(document.body);