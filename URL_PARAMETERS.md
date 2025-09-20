# URL Parameters Support

The wscribe-editor now supports loading subtitle and media files directly via URL parameters, allowing you to open the editor with specific files without having to manually select them.

## Usage

You can now open the editor with custom files by adding URL parameters:

```
http://localhost:3000/?media=https://example.com/audio.mp3&subtitle=https://example.com/subtitle.srt
```

## Parameters

- `media`: URL to the media file (audio/video)
- `subtitle`: URL to the subtitle file (JSON, SRT, or VTT format)

## Examples

### Load both media and subtitle files:
```
http://localhost:3000/?media=https://example.com/podcast.mp3&subtitle=https://example.com/transcript.json
```

### Load only a media file (uses default subtitle):
```
http://localhost:3000/?media=https://example.com/audio.mp3
```

### Load only a subtitle file (uses default media):
```
http://localhost:3000/?subtitle=https://example.com/subtitles.srt
```

## Supported File Formats

### Media Files
- Audio: MP3, WAV, OGG, etc. (any format supported by the browser)
- Video: MP4, WebM, etc. (any format supported by the browser)

### Subtitle Files
- JSON: wscribe transcript format
- SRT: SubRip subtitle format
- VTT: WebVTT subtitle format

## Error Handling

- If a URL is invalid or unreachable, the application will fall back to the default files
- Error messages will be displayed in the error list panel
- The application will continue to work with default files if URL loading fails

## Implementation Details

The implementation includes:
- URL parameter parsing utilities in `src/utils.ts`
- Async file loading with proper error handling in `src/store.ts`
- Fallback to default files on errors
- Comprehensive test coverage in `tests/utils.test.ts`

## Testing

Run the tests to verify functionality:
```bash
npm test
```

## CORS Considerations

When loading files from external URLs, ensure the server provides appropriate CORS headers or use a proxy server if needed.

