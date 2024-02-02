  
  import React, { useState, useEffect, useRef } from "react";
  import { ipcRenderer, shell } from "electron";
  import path from "path";
  import fs from "fs";
  import File from "./FileButton";

  import {FaFolderOpen, FaFileMedical} from 'react-icons/fa'
  import {MdFeedback} from 'react-icons/md'

  import { Tooltip } from "react-tooltip";

  const { v4: uuid } = require('uuid');

  const ignoreList = [
    '.git',
    '.DS_Store',
  ];

  const extension = '.dnt';

  function FileManager({content, updateContent, setEditorLoaded, openFilePath }) {

      const [explorerData, setExplorerData] = useState(null)
      const [workingFolder, setWorkingFolder] = useState(null)
      const [workingFile, setWorkingFile] = useState(null)

      const contentRef = useRef(content);
      const workingFolderRef = useRef(workingFolder);

      const openNewFile = () => {
        updateContent(null, "");
      }

      const getFolderData = (folderPath) => {

          // console.log(typeof folderPath, folderPath)

          if(!folderPath || folderPath === '')
                return;

          if(!fs.existsSync(folderPath))
              return;

          let folderData = {
              name: path.basename(folderPath),
              path: folderPath,
              isFolder: true,
              onClick: () => {},
              id: uuid(),
              items: []
          };

          let folderChildren = fs.readdirSync(folderPath);

          folderChildren.forEach(file => {
              if (ignoreList.includes(file))
                  return;
              
              if (fs.lstatSync(path.join(folderPath, file)).isDirectory()){
                  const newFolderData = getFolderData(path.join(folderPath, file))
                  if(newFolderData)
                    folderData.items.push(newFolderData);
              }else{
                    if (path.extname(file) !== extension)
                        return;

                  folderData.items.push({
                      name: file.split(extension)[0],
                      path: path.join(folderPath, file),
                      onClick: () => { updateContent(path.join(folderPath, file), fs.readFileSync(path.join(folderPath, file), 'utf8')); },
                      isFolder: false,
                      id: uuid(),
                      items: []
                  });
              }
          });

          return folderData;
      }

      useEffect(() => {
        contentRef.current = content;
      }, [content]);

      useEffect(() => {
        workingFolderRef.current = workingFolder;
      }, [workingFolder]);

      useEffect(() => {
          // directory was selected
          ipcRenderer.on('open-folder-reply', (event, folderPath) => {
              if (!folderPath)
                  return;

              setWorkingFolder(folderPath);

              let folderData = getFolderData(folderPath);

              console.log(folderData)

              setExplorerData(folderData);

              setEditorLoaded(true);
          });

          // file shortcut was pressed
          ipcRenderer.on('file-saved-shortcut', (event) => {
              if (workingFile){
                  console.log('file is already saved');
                  return;
              }

              ipcRenderer.send('file-saved');
          })

          // new file shortcut was pressed
          ipcRenderer.on('new-file-shortcut', (event) => {
            openNewFile();
          })

          // file was saved
          ipcRenderer.on('file-saved-reply', (event, filePath) => {
            filePath = `${filePath}`;
            console.log('file-saved-reply', filePath);
            console.log('contentRef.current', contentRef.current);

            updateContent(filePath, contentRef.current);

            if (!filePath)
                return;
            setWorkingFile(filePath);

            console.log('workingFolder', workingFolderRef.current);
            
            // update explorer
            let folderData = getFolderData(workingFolderRef.current);
            setExplorerData(folderData);
          });

          // call open folder
          ipcRenderer.send('open-saved-folder');

          return () => {
              ipcRenderer.removeAllListeners();
          };
      }, []);

      const [b1active, setB1active] = useState(false)
      const [b2active, setB2active] = useState(false)
              
      return (
          <>
            <div style={{backgroundColor:'#f7fbff', boxShadow: "0px 1px 1px lightgray", paddingTop:1,display:'flex', flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <Tooltip place='bottom' id='filetool'/>
                <button 
                  style={{backgroundColor:'transparent', border:'none', color:'#000',  
                  display:'flex', flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                  // show cursor as pointer when hovering over button
                  cursor: 'pointer',
                  }} 
                  onClick={() => {shell.openExternal('https://www.denote.app')}}
                  data-tooltip-id="filetool" data-tooltip-content="Visit Denote's website"
                  >
                    <h3 style={{paddingLeft:10, color:'#000', fontFamily: 'Open Sans', fontSize:15.5}}>Denote</h3></button>
                <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <FaFolderOpen style={{marginRight:20, fontSize:18}} onClick={() => {ipcRenderer.send('open-folder')}}
                  data-tooltip-id="filetool" data-tooltip-content="Open Folder (Cmd o)"
                />
                <FaFileMedical style={{marginRight:20}} onClick={() => {openNewFile();}}
                  data-tooltip-id="filetool" data-tooltip-content="Create File (Cmd n)"
                />
                </div>
            </div>
            <div style={{height:650, overflowY:'scroll'}}>
            {explorerData ?
              <File explorer={explorerData} isRoot={true} key={explorerData.id} openFilePath={openFilePath}/>
              : <></>
            }
            </div>
            <div
                style={{
                    width: '20vw',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    overflow: 'hidden',
                    paddingBottom:10,
                }}
            >
                <div style={{display:'flex', flexDirection:'row', justifyContent:'space-around', alignItems:'bottom', padding:0}}>
                    {/* <a href="https://docs.google.com/forms/d/e/1FAIpQLScrKy8d5o10RFF_nN1-Fi5XsUfO91mPfubCJksNmn4Pg7cQCA/viewform?usp=sharing" target="_blank" style={{color:'#000', textDecoration:'none', fontSize:14}}>Report Bug</a>
                    <a href="https://docs.google.com/forms/d/e/1FAIpQLSeBrsSktvQxQ4KvnraRsd5Ob2uBvPriU15wIVQsRP1sBM78ig/viewform?usp=sharing" target="_blank" style={{color:'#000', textDecoration:'none', fontSize:14}}>Request Feature</a> */}

                    <button 
                        style={{
                            border:'none', color:'#666',
                            cursor: 'pointer',
                            fontFamily:'Open Sans',
                            background:'transparent',

                        }} onClick={() => {shell.openExternal('https://docs.google.com/forms/d/e/1FAIpQLScrKy8d5o10RFF_nN1-Fi5XsUfO91mPfubCJksNmn4Pg7cQCA/viewform?usp=sharing')}}
                        data-tooltip-id="feedback" data-tooltip-content="Report Bugs"
                        onMouseEnter={()=>setB1active(true)}
                        onMouseLeave={()=>setB1active(false)}
                        >
                            {b1active ? <u>Report Bug</u> : "Report Bug"}
                    </button>
                    <button 
                        style={{border:'none', color:'#666',  
                        fontFamily: 'Open Sans',
                        background:'transparent',
                        
                        // show cursor as pointer when hovering over button
                        cursor: 'pointer',
                        }} onClick={() => {shell.openExternal('https://docs.google.com/forms/d/e/1FAIpQLSeBrsSktvQxQ4KvnraRsd5Ob2uBvPriU15wIVQsRP1sBM78ig/viewform?usp=sharing')}}
                        data-tooltip-id="feedback" data-tooltip-content="Request Features"
                        onMouseEnter={()=>setB2active(true)}
                        onMouseLeave={()=>setB2active(false)}
                        >
                            {b2active ? <u>Request Feature</u> : "Request Feature"}
                    </button>
                </div>

            </div>
          </>
      );

  }
  
  export default FileManager;