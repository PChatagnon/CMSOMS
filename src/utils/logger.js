import debug from 'debug';

const COLOURS = {
    info: 'blue',
    warn: 'pink',
    error: 'red'
};

class Logger {

    generateMessage(level, message, source) {
        // Set the prefix which will cause debug to enable the message
        const namespace = `OMS:${level}`;
        const createDebug = debug(namespace);

        // Set the colour of the message based on the level
        createDebug.color = COLOURS[level];

        if (source) { createDebug(source, message); }
        else { createDebug(message); }
    }

    info(message, source) {
        return this.generateMessage('info', message, source);
    }

    warn(message, source) {
        return this.generateMessage('warn', message, source);
    }

    error(message, source) {
        return this.generateMessage('error', message, source);
    }
}

export default new Logger();