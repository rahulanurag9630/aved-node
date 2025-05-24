const apiErrorhandler = (err, req, res, next) => {
    // Ensure responseCode is a valid HTTP status code (100-599)
    const isValidStatusCode = (code) => code >= 100 && code <= 599;

    if (err.isApiError) {
        const statusCode = isValidStatusCode(err.responseCode) ? err.responseCode : 500; // Default to 500 if invalid
        res.status(statusCode).json({
            responseCode: statusCode,
            responseMessage: err.responseMessage,
        });
        return;
    }

    if (err.message === 'Validation error') {
        res.status(502).json({
            code: 502,
            responseMessage: err.original.message,
        });
        return;
    }

    // Default error response
    const statusCode = isValidStatusCode(err.code) ? err.code : 500; // Default to 500 if invalid
    res.status(statusCode).json({
        responseCode: statusCode,
        responseMessage: err.message,
    });
    return;
};

module.exports = apiErrorhandler;
