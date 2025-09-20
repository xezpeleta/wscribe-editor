# Changelog

## [Unreleased] - URL Parameters Support

### Added
- URL parameter support for loading subtitle and media files directly
- `media` parameter to specify media file URL
- `subtitle` parameter to specify subtitle file URL
- Support for JSON, SRT, and VTT subtitle formats from URLs
- Comprehensive error handling with fallback to default files
- URL parameter parsing utilities in `src/utils.ts`
- Async file loading with proper error handling in `src/store.ts`
- Test coverage for URL parameter functionality

### Changed
- Store initialization now checks for URL parameters on startup
- PlayerControl component updated to handle URL-based media files
- Enhanced error handling throughout the application

### Technical Details
- Added `getUrlParams()`, `fetchFileFromUrl()`, and `getFileNameFromUrl()` utilities
- Modified store initialization to be async and handle URL-based file loading
- Maintained full backward compatibility with existing functionality
- All existing tests pass, with new tests added for URL parameter functionality

### Usage
```
http://localhost:3000/?media=https://example.com/audio.mp3&subtitle=https://example.com/subtitle.srt
```

### Files Modified
- `src/utils.ts` - Added URL parameter utilities
- `src/store.ts` - Modified store initialization for URL support
- `src/components/PlayerControl.svelte` - Updated for URL-based media
- `tests/utils.test.ts` - Added URL parameter tests
- `URL_PARAMETERS.md` - Added documentation
