require('dotenv').config({ path: '.env' });

const _ = require('lodash');
const validator = require('validator');
const connectToDatabase = require('./db/connection');
const Note = require('./models/Note');

const createErrorResponse = (statusCode, message) => ({
    statusCode: statusCode || 501,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        error: message || 'An Error occurred.',
    }),
});

const returnError = (error) => {
    console.log(error);
    if (error.name) {
        const message = `Invalid ${error.path}: ${error.value}`;
        return createErrorResponse(400, `Error:: ${message}`);
    } else {
        return createErrorResponse(error.statusCode || 500, `Error:: ${error.name}`);
    }
};

module.exports.create = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    if (_.isEmpty(event.body)) {
        return createErrorResponse(400, 'Missing details');
    }
    const { title, description, reminder, status, category } = JSON.parse(
        event.body
    );

    const noteObj = new Note({
        title,
        description,
        reminder,
        status,
        category,
    });

    if (noteObj.validateSync()) {
        return createErrorResponse(400, 'Incorrect note details');
    }

    try {
        await connectToDatabase();
        const note = await Note.create(noteObj);
        return {
            statusCode: 200,
            body: JSON.stringify(note),
        }
    } catch (error) {
        returnError(error);
    }
};

module.exports.getOne = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const id = event.pathParameters.id;
    if (!validator.isAlphanumeric(id)) {
        return createErrorResponse(400, 'Incorrect Id.');
    }

    try {
        await connectToDatabase();
        const note = await Note.findById(id);

        if (!note) {
           return createErrorResponse(404, `No Note found with id: ${id}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify(note),
        };
    } catch (error) {
        returnError(error);
    }
};

module.exports.getAll = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    try {
        await connectToDatabase();
        const notes = await Note.find();
        if (!notes) {
            return createErrorResponse(404, 'No Notes Found.');
        }

        return  {
            statusCode: 200,
            body: JSON.stringify(notes),
        };
    } catch (error) {
        returnError(error);
    }
};

module.exports.update = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const data = JSON.parse(event.body);

    if (!validator.isAlphanumeric(event.pathParameters.id)) {
        return createErrorResponse(400, 'Incorrect Id.');
    }

    if (_.isEmpty(data)) {
        return createErrorResponse(400, 'Missing details');
    }
    const { title, description, reminder, status, category } = data;

    try {
        await connectToDatabase();

        const note = await Note.findById(event.pathParameters.id);

        if (note) {
            note.title = title || note.title;
            note.description = description || note.description;
            note.reminder = reminder || note.reminder;
            note.status = status || note.status;
            note.category = category || note.category;
        }

        const newNote = await note.save();
        console.log(newNote, 1111111)
        return {
            statusCode: 204,
            body: JSON.stringify(newNote),
        };
    } catch (error) {
        returnError(error);
    }
};

module.exports.delete = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const id = event.pathParameters.id;
    if (!validator.isAlphanumeric(id)) {
        return createErrorResponse(400, 'Incorrect Id.');
    }
    try {
        await connectToDatabase();
        const note = await Note.findByIdAndRemove(id);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Removed note with id: ${note._id}`,
                note,
            }),
        };
    } catch (error) {
        returnError(error);
    }
};