import React from 'react';
import AceEditor from 'react-ace';
import FormLabel from '@material-ui/core/FormLabel';

import 'brace/mode/json';
import 'brace/theme/textmate';

/*
equivalent ace-builds imports:
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-textmate';
*/

const JsonAceEditor = props => {
    return (
        <div style={{ marginBottom: 0, marginTop: 10 }}>
            <FormLabel style={{ fontSize: 12 }}>{`${props.title} (${props.maxSize}/${props.json.length})`}</FormLabel>
            <AceEditor
                mode='json'
                style={{
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    marginTop: 5, fontSize: 13, zIndex: 1,
                    backgroundColor: props.disabled ? '#f0f0f0' : 'white'
                }}
                theme='textmate'
                placeholder={props.placeholder || 'Enter configuration json here'}
                value={props.json}
                onChange={newValue => props.onChange(newValue)}
                setOptions={{
                    showLineNumbers: true,
                    tabSize: 2,
                    readOnly: props.disabled || false
                }}
                editorProps={{ $blockScrolling: Infinity }}
                fontSize={14}
                showPrintMargin={true}
                showGutter={true}
                height={'350px'}
            />
        </div>
    );
}

export default JsonAceEditor;
