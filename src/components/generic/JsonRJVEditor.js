import React from 'react';
import ReactJson from 'react-json-view'
import FormLabel from '@material-ui/core/FormLabel';

const theme = {
    base00: "white",
    base01: "#ddd",
    base02: "#ddd",
    base03: "#444",
    base04: "purple",
    base05: "#444",
    base06: "#444",
    base07: "#444",
    base08: "#444",
    base09: "#1e88e5",
    base0A: "#1e88e5",
    base0B: "#1e88e5",
    base0C: "#1e88e5",
    base0D: "#1e88e5",
    base0E: "#1e88e5",
    base0F: "#1e88e5"
};

const JsonRJVEditor = props => {
    return (
        <div style={{ marginBottom: 0, marginTop: 10 }}>
            <FormLabel style={{ fontSize: 12 }}>{props.title}</FormLabel>
            <ReactJson
                src={props.json || {}}
                style={{ marginTop: 5, fontSize: 13, zIndex: 1 }}
                name={null}
                enableClipboard={false}
                displayObjectSize={false}
                displayDataTypes={false}
                onEdit={event => props.onChange(event.updated_src)}
                onAdd={event => props.onChange(event.updated_src)}
                onDelete={event => props.onChange(event.updated_src)}
                theme={theme}
            />
        </div>
    );
}

export default JsonRJVEditor;