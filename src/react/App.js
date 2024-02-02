import React, {useState, useEffect, useRef} from "react";
// import Editor from "./quill/Editor";
import Editor, {resetEditorContent} from "./tiptap/Editor";
import FileManager from "./file_manager/FileManager";
// import DrawBox from './tiptap/DrawBoxComponent';
import {BsDot} from 'react-icons/bs'

import { Tooltip } from "react-tooltip";

export default () => {

    const [data, setData] = useState('');
    const [editor, setEditor] = useState(null);
    const [isEditorLoaded, setIsEditorLoaded] = useState(false);
    const [filePath, setFilePath] = useState(null); // null means unsaved
    const [fileName, setFileName] = useState(`Untitled`);

    const [serverURL, setServerURL] = useState("http://localhost:3000");
    
    // ref to last editor
    const editorRef = useRef(editor);

    // update ref to last editor
    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    const handleDataUpdate = (newData) => {
        setData(newData);
    };

    return (
        <div 
            style={{

                overflow: 'hidden',
                fontFamily: 'Open Sans',
                
            }}
        >
            <div 
                style={{
                    width: '20vw',
                    height: '100vh',
                    backgroundColor: 'white',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    overflow: 'hidden',
                    boxShadow: "0px 0px 7px #9E9E9E",
                    // borderTopRightRadius:18,
                    // borderBottomRightRadius:18,
                    backgroundColor:'#f7fbff'
                }}
            >                   
                
                <div style={{backgroundColor:'#f7fbff', height:720}}>
                <FileManager
                    content={data}
                    setEditorLoaded={setIsEditorLoaded}
                    style={{
                        width: '100%',
                        
                    }}
                    openFilePath={filePath}
                />
                </div>
            </div>

            <div
                style={{
                    width: '80vw',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: '20vw',
                    overflow: 'hidden',
                }}
            >

                {isEditorLoaded && serverURL?
                    <Editor
                        style={{
                            height: '100%',
                            width: '100%',
                            overflow: 'hidden',
                        }}
                        content={data}
                        setEditorCallback={setEditor}
                        updateContent={handleDataUpdate}
                        fileName={fileName}
                        serverURL={serverURL}
                    />
                    :
                    isEditorLoaded?
                        <h2>You must be connected to internet the first time you open the app to set up your profile</h2>
                    :
                    <h2>Please select a folder to start writing in</h2>
                }   

            </div>
            
        </div>
    )
};
