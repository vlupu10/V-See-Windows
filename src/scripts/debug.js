/**
 * Author: Viorel LUPU
 * Date: 2026-02-17
 * Purpose: Debug logging – echoes console.log/warn/error and unhandled errors to a log file.
 * Load this script first (before main.js) so all logs are captured.
 * Log file: Windows %APPDATA%\V-See\logs\v-see.log
 */
(function () {
    'use strict';

    /** Turns console.log-style arguments into a single string (handles objects, errors, null). */
    function serialize(args) {
        try {
            return Array.from(args)
                .map(function (a) {
                    if (a === null) return 'null';
                    if (a === undefined) return 'undefined';
                    if (typeof a === 'object' && a instanceof Error) {
                        return (a.message || String(a)) + (a.stack ? '\n' + a.stack : '');
                    }
                    if (typeof a === 'object') return JSON.stringify(a);
                    return String(a);
                })
                .join(' ');
        } catch (e) {
            return String(args);
        }
    }

    /** Sends a log line to the Tauri debug_log command (file + terminal). */
    function sendToLog(level, message) {
        try {
            var invokeFn = window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke;
            if (typeof invokeFn !== 'function') return;
            invokeFn('debug_log', { level: level, message: message }).catch(function () {});
        } catch (e) {}
    }

    var origLog = console.log;
    var origWarn = console.warn;
    var origError = console.error;

    /**
     * App logger: sends to log file + terminal (via debug_log). Use for restore/persistence debugging.
     * Usage: vseeLog.debug('FolderTree', 'restore path', pathToRestore);
     */
    function vseeLog(level, tag) {
        var args = Array.prototype.slice.call(arguments, 2);
        var message;
        try {
            message = tag + (args.length ? ' ' + serialize(args) : '');
        } catch (e) {
            message = tag + ' ' + String(args);
        }
        var orig = level === 'warn' ? origWarn : level === 'error' ? origError : origLog;
        orig.apply(console, ['[' + tag + ']'].concat(args));
        sendToLog(level, message);
    }
    vseeLog.debug = function () { vseeLog.apply(null, ['debug'].concat(Array.prototype.slice.call(arguments))); };
    vseeLog.log = function () { vseeLog.apply(null, ['log'].concat(Array.prototype.slice.call(arguments))); };
    vseeLog.warn = function () { vseeLog.apply(null, ['warn'].concat(Array.prototype.slice.call(arguments))); };
    vseeLog.error = function () { vseeLog.apply(null, ['error'].concat(Array.prototype.slice.call(arguments))); };
    window.vseeLog = vseeLog;

    console.log = function () {
        origLog.apply(console, arguments);
        sendToLog('log', serialize(arguments));
    };
    console.warn = function () {
        origWarn.apply(console, arguments);
        sendToLog('warn', serialize(arguments));
    };
    console.error = function () {
        origError.apply(console, arguments);
        sendToLog('error', serialize(arguments));
    };

    window.addEventListener('error', function (event) {
        var msg = event.message || String(event);
        if (event.filename) msg += ' at ' + event.filename + (event.lineno != null ? ':' + event.lineno : '');
        if (event.error && event.error.stack) msg += '\n' + event.error.stack;
        sendToLog('error', msg);
    });

    window.addEventListener('unhandledrejection', function (event) {
        var msg = 'Unhandled promise rejection: ' + (event.reason && (event.reason.message || event.reason.stack || String(event.reason)) || event.reason);
        sendToLog('error', msg);
    });
})();
