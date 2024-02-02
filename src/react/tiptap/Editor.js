import './styles.scss'

import React, {useEffect, useState, useRef} from 'react'

import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
// import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import { EditorContent, useEditor, ReactNodeViewRenderer, Extension} from '@tiptap/react'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
// import Highlight from '@tiptap/extension-highlight'
import Highlight from './HighlightExtension'
import Typography from '@tiptap/extension-typography'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import { EditorState } from 'prosemirror-state';
import Dropcursor from '@tiptap/extension-dropcursor'
import { Markdown } from 'tiptap-markdown';

import MyMathBoxNode from './InlineMathExtension'
import {SmilieReplacer} from './EmojiReplacerExtension'
import CodeBlockExtension from './CodeBlockExtension'
import {callAIPrompt, callAIPromptWithQuestion} from './AIPromptsExtension'
import ImageExtension from './ImageExtension'
import DrawBoxNode from './DrawBoxExtension'

import { RiBold, RiItalic, RiStrikethrough, RiCodeSSlashLine, RiFormatClear, RiH1, RiH2, RiH3, RiListUnordered, RiListOrdered, RiCodeBoxFill, RiDoubleQuotesL, RiUnderline,RiRegEdit, RiQuestionMark, RiMarkPenFill, RiImageAddFill, RiCheckboxLine} from "react-icons/ri";
import { HiSparkles } from "react-icons/hi2";
import { RiBarChartHorizontalLine } from 'react-icons/ri'
import { RxDividerHorizontal } from 'react-icons/rx'
import { BiMath } from 'react-icons/bi'
import { TbBracketsContain, TbMath } from 'react-icons/tb'
import { MdDraw } from 'react-icons/md'
import {FaUndo, FaRedo} from 'react-icons/fa'

import styled, { keyframes } from 'styled-components'

import {ipcRenderer} from 'electron'
import fs from 'fs'
import Modal from 'react-modal'
import {Tooltip} from 'react-tooltip'


const spin = keyframes`
      from {
        transform: rotate(0deg); 
      }

      to {
        transform: rotate(360deg); 
      }
    `

    const Loader = styled.div`
      border: 16px solid #f3f3f3;
      border-radius: 50%;
      border-top: 16px solid #3498db;
      width: 90px;
      height: 90px;
      -webkit-animation: spin 2s linear infinite; /* Safari */
      animation: ${spin} 2s linear infinite;
    `



export function resetEditorContent(editor, newContent) {
  editor.commands.setContent(newContent);

  // The following code clears the history. Hopefully without side effects.
  const newEditorState = EditorState.create({
      doc: editor.state.doc,
      plugins: editor.state.plugins,
      schema: editor.state.schema
  });
  editor.view.updateState(newEditorState);
} 

const MenuBar = ({ editor, fileName, callprompt }) => {
    if (!editor) {
      return null
    }

    let initCols = []
    // number refers to number of icons
    for (let i = 0; i < 24; i++)
      initCols.push('black')
    const [cols, setCols] = useState(initCols)


  
    return (
      <div style={{display:'flex',flexDirection:'row', justifyContent:'left',}}>
        <div style={{background:'transparent',paddingRight:'1rem', paddingBottom:'0.5rem', width:'100%'}}>
          <div style={{backgroundColor:'#f7fbff', paddingLeft:'1rem',boxShadow: "0px 1px 1px lightgray", width:'80vw', height:'3.45rem', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <span style={{fontSize: 15.5, fontWeight: 'default', }}>{fileName}</span>
          </div>
          <div style={{marginLeft:'2rem', marginRight:'2rem',backgroundColor:'#dfeaf7',boxShadow: "0px 1px 1px lightgray", borderBottomLeftRadius:22, borderBottomRightRadius:22, height: '2.5rem',display:'flex', flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between', width:'2.8rem', paddingLeft:15}}>
            </div>
              <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between', width:600, alignItems:'center', fontSize:17, paddingLeft:15}}>
                <RiBold
                  onClick={() => {
                    editor.chain().focus().toggleBold().run()
                  }}
                  onMouseDown={()=>cols[0] = 'gray'}
                  onMouseUp={()=>cols[0] = 'black'}
                  style={{color:cols[0]}}
                  disabled={
                    !editor.can()
                      .chain()
                      .focus()
                      .toggleBold()
                      .run()
                  }
                  className={editor.isActive('bold') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Bold (Cmd b)"
                >
                  bold
                </RiBold>
                <Tooltip place='bottom' id='tool'/>
                <RiItalic
                  onMouseDown={()=>cols[1] = 'gray'}
                  onMouseUp={()=>cols[1] = 'black'}
                  style={{color:cols[1]}}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  disabled={
                    !editor.can()
                      .chain()
                      .focus()
                      .toggleItalic()
                      .run()
                  }
                  className={editor.isActive('italic') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Italic (Cmd i)"
                >
                  italic
                </RiItalic>
                
                <RiUnderline
                  onMouseDown={()=>cols[2] = 'gray'}
                  onMouseUp={()=>cols[2] = 'black'}
                  style={{color:cols[2]}}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  disabled={
                    !editor.can()
                      .chain()
                      .focus()
                      .toggleItalic()
                      .run()
                  }
                  className={editor.isActive('underline') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Underline (Cmd u)"
                >
                  Underline
                </RiUnderline>
                <RiStrikethrough
                  onMouseDown={()=>cols[3] = 'gray'}
                  onMouseUp={()=>cols[3] = 'black'}
                  style={{color:cols[3]}}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  disabled={
                    !editor.can()
                      .chain()
                      .focus()
                      .toggleStrike()
                      .run()
                  }
                  className={editor.isActive('strike') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Strike (Cmd Shft x)"

                >
                  strike
                </RiStrikethrough>

                <RiH1
                onMouseDown={()=>cols[6] = 'gray'}
                onMouseUp={()=>cols[6] = 'black'}
                style={{color:cols[6]}}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Heading 1 (Cmd Shft 1)"
                >
                  h1
                </RiH1>
                <RiH2
                onMouseDown={()=>cols[7] = 'gray'}
                onMouseUp={()=>cols[7] = 'black'}
                style={{color:cols[7]}}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Heading 2 (Cmd Shft 2)"

                >
                  h2
                </RiH2>
                <RiH3
                onMouseDown={()=>cols[8] = 'gray'}
                onMouseUp={()=>cols[8] = 'black'}
                style={{color:cols[8]}}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Heading 3 (Cmd Shft 3)"

                >
                  h3
                </RiH3>

                <RiCodeSSlashLine
                  onMouseDown={()=>cols[4] = 'gray'}
                  onMouseUp={()=>cols[4] = 'black'}
                  style={{color:cols[4]}}
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  disabled={
                    !editor.can()
                      .chain()
                      .focus()
                      .toggleCode()
                      .run()
                  }
                  className={editor.isActive('code') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Code Inline (Cmd e)"
                >
                  code
                </RiCodeSSlashLine>

                <RiFormatClear onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} 
                  onMouseDown={()=>cols[5] = 'gray'}
                  onMouseUp={()=>cols[5] = 'black'}
                  style={{color:cols[5]}}
                  // create a shortcut for this
                  data-tooltip-id="tool" data-tooltip-content="Clear Format (Cmd Shft x)">
                    clear nodes
                </RiFormatClear>

                <RiMarkPenFill
                  onMouseDown={()=>cols[21] = 'gray'}
                  onMouseUp={()=>cols[21] = 'black'}
                  style={{color:cols[21]}}
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                  className={editor.isActive('highlight') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Highlight (Cmd Shft h)"
                >
                  highlight
                </RiMarkPenFill>


                <div style={{backgroundColor:'gray', width:1, height:15, marginLeft:2, marginRight:2}}></div>

                <RiListUnordered
                onMouseDown={()=>cols[9] = 'gray'}
                onMouseUp={()=>cols[9] = 'black'}
                style={{color:cols[9]}}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={editor.isActive('bulletList') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Unordered List (Cmd Shft 8)"
                >
                  bullet list
                </RiListUnordered>
                <RiListOrdered
                onMouseDown={()=>cols[10] = 'gray'}
                onMouseUp={()=>cols[10] = 'black'}
                style={{color:cols[10]}}
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={editor.isActive('orderedList') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Ordered List (Cmd Shft 7)"
                >
                  ordered list
                </RiListOrdered>
                <RiCheckboxLine
                onMouseDown={()=>cols[23] = 'gray'}
                onMouseUp={()=>cols[23] = 'black'}
                style={{color:cols[23]}}
                  onClick={() => editor.chain().focus().toggleTaskList().run()}
                  className={editor.isActive('taskList') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Task List (Cmd Shft 9)"
                >
                  task list
                </RiCheckboxLine>

                <div style={{backgroundColor:'gray', width:1, height:15, marginLeft:2, marginRight:2}}></div>

                <RiDoubleQuotesL
                onMouseDown={()=>cols[12] = 'gray'}
                onMouseUp={()=>cols[12] = 'black'}
                style={{color:cols[12]}}
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={editor.isActive('blockquote') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Quote Block (Cmd Shft b)"
                >
                  blockquote
                </RiDoubleQuotesL>
                <RxDividerHorizontal onClick={() => editor.chain().focus().setHorizontalRule().run()}
                onMouseDown={()=>cols[13] = 'gray'}
                onMouseUp={()=>cols[13] = 'black'}
                style={{color:cols[13]}}
                data-tooltip-id="tool" data-tooltip-content="Horizontal Line (Cmd Shft -)"
                >
                  horizontal rule
                </RxDividerHorizontal>
                <TbMath
                onMouseDown={()=>cols[14] = 'gray'}
                onMouseUp={()=>cols[14] = 'black'}
                style={{color:cols[14]}}
                  onClick={() => editor.commands.insertInlineMathBox()}
                  className={editor.isActive('inline-math-field') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Insert Math (Cmd m)"
                >
                  maf
                </TbMath>
                <RiCodeBoxFill
                onMouseDown={()=>cols[11] = 'gray'}
                onMouseUp={()=>cols[11] = 'black'}
                style={{color:cols[11]}}
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
                  className={editor.isActive('codeBlock') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Code Block (Cmd Shft e)"
                >
                  code block
                </RiCodeBoxFill>
                <RiImageAddFill onClick={()=> { ipcRenderer.send('open-image');  }}
                onMouseDown={()=>cols[22] = 'gray'}
                onMouseUp={()=>cols[22] = 'black'}
                style={{color:cols[22]}}
                data-tooltip-id="tool" data-tooltip-content="Insert Image (Cmd Shft i)"
                >
                  insert image
                </RiImageAddFill>
                {/* <MdDraw
                  onMouseDown={()=>cols[17] = 'gray'}
                  onMouseUp={()=>cols[17] = 'black'}
                  style={{color:cols[17]}}
                  onClick={() => editor.commands.insertDrawBox()}
                  className={editor.isActive('draw-box') ? 'is-active' : ''}
                  data-tooltip-id="tool" data-tooltip-content="Insert Draw Box (Cmd Shft d)"
                >
                    Draw
                </MdDraw> */}

                <div style={{backgroundColor:'gray', width:1, height:15, marginLeft:2, marginRight:2}}></div>

                <RiQuestionMark
                  onMouseDown={()=>cols[18] = 'gray'}
                  onMouseUp={()=>cols[18] = 'black'}
                  style={{color:cols[18]}}
                  data-tooltip-id="tool" data-tooltip-content="Prompt AI (Cmd Alt p)"
                  onClick={() => {
                    callprompt(editor, 'Prompt');
                  }}
                >
                  Prompt
                </RiQuestionMark>
                <HiSparkles
                  onMouseDown={()=>cols[19] = 'gray'}
                  onMouseUp={()=>cols[19] = 'black'}
                  style={{color:cols[19]}}
                  data-tooltip-id="tool" data-tooltip-content="Beautify Selection (Cmd Alt b)"
                  onClick={() => {
                    callprompt(editor, 'Beautify');
                  }}
                >
                  Beautify
                </HiSparkles>
                <TbBracketsContain
                  onMouseDown={()=>cols[20] = 'gray'}
                  onMouseUp={()=>cols[20] = 'black'}
                  style={{color:cols[20]}}
                  data-tooltip-id="tool" data-tooltip-content="Fills [...] in Selection (Cmd Alt f)"
                  onClick={() => {
                    callprompt(editor, 'FillBlanks');
                  }}
                >
                  FillBlanks
                </TbBracketsContain>
              </div>
              <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between', width:'2.8rem', paddingRight:15}}>
                <FaUndo
                  onMouseDown={()=>cols[15] = 'gray'}
                  onMouseUp={()=>cols[15] = 'black'}
                  style={{color:cols[15]}}
                  onClick={() => editor.chain().focus().undo().run()}
                  data-tooltip-id="tool" data-tooltip-content="Undo (Cmd z)"
                  disabled={
                    !editor.can()
                      .chain()
                      .focus()
                      .undo()
                      .run()
                  }
                >
                  undo
                </FaUndo>
                <FaRedo
                  onMouseDown={()=>cols[16] = 'gray'}
                  onMouseUp={()=>cols[16] = 'black'}
                  style={{color:cols[16]}}
                  onClick={() => editor.chain().focus().redo().run()}
                  data-tooltip-id="tool" data-tooltip-content="Redo (Cmd Shft z)"
                  disabled={
                    !editor.can()
                      .chain()
                      .focus()
                      .redo()
                      .run()
                  }
                >
                redo
                </FaRedo>
                

            </div>
          </div>
        </div>
      </div>
    )
}

export default ({content, updateContent, setEditorCallback, fileName, version, userID, serverURL, platform, clearCacheAndQuit, clearUpdateCache}) => {

    const [promptModalOpen, setPromptModalOpen] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [loadingModalOpen, setLoadingModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [selection, setSelection] = useState(null);

    // const [myEditorState, setMyEditorState] = useState(null);

    const editorRef = useRef(null);

    const setErrorMessage = (message) => {
      fetch(serverURL + '/event', {
        method: 'POST',
        body: JSON.stringify({
            userID: userID,
            type: 'ai_error',
            aditionalData: `${message}`
        }),
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors'
      })
      setError(message);
      setErrorModalOpen(true);
    }

    const editor = useEditor({
        extensions: [
            Document,
            Paragraph,
            Text,
            Dropcursor,
            TaskList,
            TaskItem.configure({
              nested: true,
            }),
            MyMathBoxNode,
            SmilieReplacer,
            Underline,
            Highlight,
            Typography,
            ImageExtension,
            // DrawBoxNode,
            TextStyle.configure({ types: [ListItem.name] }),
            // add placeholder
            Placeholder.configure({
                placeholder: 'Your journey starts here...',
                showOnlyCurrent: true,
            }),
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
                },
                // disable spellcheck in inline code
                code: {
                    spellCheck: false,
                }
            }),
            CodeBlockExtension,
            // new command to save editor content
            Extension.create({
                name: 'misc',
                addCommands() {
                    return {
                        save: () => ({ editor }) => {
                            updateContent(editor.getHTML());
                        },
                    }
                },

                addKeyboardShortcuts() {
                    return {
                      'Mod-Shift--': () => this.editor.chain().focus().setHorizontalRule().run(),
                      'Mod-Shift-1': () => this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
                      'Mod-Shift-2': () => this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
                      'Mod-Shift-3': () => this.editor.chain().focus().toggleHeading({ level: 3 }).run(),
                      'Mod-Shift-b': () => this.editor.chain().focus().toggleBlockquote().run(),
                      'Mod-Shift-e': () => this.editor.chain().focus().toggleCodeBlock().run(),
                      'Mod-Alt-b': () => callprompt(this.editor, 'Beautify'),
                      'Mod-Alt-f': () => callprompt(this.editor, 'FillBlanks'),
                      'Mod-Alt-p': () => callprompt(this.editor, 'Prompt'),
                      'Mod-Shift-x': () => this.editor.chain().focus().clearNodes().unsetAllMarks().run(),
                      'Mod-Alt-Shift-Control-o': () => clearCacheAndQuit(),
                      'Mod-Alt-Shift-Control-u': () => clearUpdateCache(),
                    }
                }
            }),
            Markdown.configure({
              breaks: true,
            }),
        ],
        onUpdate({ editor }) {
            updateContent(editor.getHTML());
        },
        content: content,

    })
    
    useEffect(() => {
      setEditorCallback(editor);
      // setMyEditorState(editor);
      editorRef.current = editor;
    }, [editor])

    function convertImageToBase64(imgUrl, callback) {
      const image = new Image();
      image.crossOrigin='anonymous';
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = image.naturalHeight;
        canvas.width = image.naturalWidth;
        ctx.drawImage(image, 0, 0);
        const dataUrl = canvas.toDataURL();
        callback && callback(dataUrl)
      }
      image.src = imgUrl;
    }

    const getImageHeightAndWidth = (base64) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({width: img.width, height: img.height});
        };
        img.onerror = reject;
        img.src = base64;
      });
    }

    useEffect(() => {
      ipcRenderer.on('open-image-reply', async (event, filePath) => {
        if (filePath) {
          // in base64, add data in form "data:image/png;base64,dataHere"
          const base64Data = fs.readFileSync(filePath, { encoding: 'base64' })
          const imageType = filePath.split('.').pop();

          const base64 = `data:image/${imageType};base64,${base64Data}` 

          let {width, height} = await getImageHeightAndWidth(base64);

          console.log(width)

          // const editorWidth = editorRef.current.view.dom.clientWidth;

          // console.log(editorWidth, width, height);

          // if(width > editorWidth){
          //   height = width / editorWidth * height;
          //   width = editorWidth;
          // }

          editorRef.current.chain().focus().insertMyImage({ base64: base64 }).run()

        }
      })

      return () => {
        ipcRenderer.removeAllListeners('open-image-reply')
      }
    }, []);

    const handleKeyDown = (event) => {
      // make sure not in a code block
      if (event.key === 'Tab') {
        event.preventDefault()
        editor.chain().focus().insertContent('\t').run()
      }
    }

    const callprompt = (editor, prompt) => {
      if(prompt === 'Prompt'){
        if (!editor.state.selection.empty) {
          return setErrorMessage('Place your cursor in the editor.');
        }
    
        setSelection({from: editor.view.state.selection.from, to: editor.view.state.selection.to});
        setPromptModalOpen(true);
      }
      else
        // editor, promptTitle, errorCallback, loadingCallback, paymentCallback, serverURL, userID, version
        callAIPrompt(editor, prompt, setErrorMessage, setLoadingModalOpen, setPaymentModalOpen, serverURL, userID, version)
    }

    // handle paste, if image, convert to base64 and insert, if not, just handle normally
    const handlePaste = (event) => {
      const items = (event.clipboardData || event.originalEvent.clipboardData).items;
      for (let index in items) {
        const item = items[index];
        if (item.kind === 'file') {
          const blob = item.getAsFile();
          const reader = new FileReader();
          reader.onload = function(event){
            const base64 = event.target.result;
            editorRef.current.chain().focus().insertMyImage({ base64: base64 }).run()
          }; // data url!
          reader.readAsDataURL(blob);
        }
      }
    }

    const handleDrop = (event) => {
      event.preventDefault();
      event.stopPropagation()

      console.log('dropped', event)

      const files = event.dataTransfer.files;
      for (let index in files) {
        const file = files[index];
        const reader = new FileReader();
        reader.onload = function(event){
          const base64 = event.target.result;
          editorRef.current.chain().focus().insertMyImage({ base64: base64 }).run()
        }; // data url!
        reader.readAsDataURL(file);
      }
    }

    const handleDragOver = (event) => {
      event.preventDefault();
      event.stopPropagation();

      event.dataTransfer.dropEffect = 'copy';
      // event.target.style.opacity = 0.5;
    }

  
    const [buttonBG, setButtonBG] = useState('#2f80ed')
    
    return (
        <>
            {/* PROMPT MODAL */}
            <Modal
              isOpen={promptModalOpen}
              onRequestClose={() => setPromptModalOpen(false)}
              contentLabel="Prompt Modal"
              ariaHideApp={false}
              style={{
                overlay: {
                  backgroundColor: 'rgba(0,0,0,0.5)',
                },
                content: {
                  backgroundColor: 'white',
                  width: '50%',
                  height: '30%',
                  margin: 'auto',
                  display: 'flex',
                  borderRadius:18,
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }
              }}
            >
              <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width:'100%'}}>
                <span style={{fontSize: 20, fontWeight: 'bold', fontFamily:'Open Sans'}}>Enter your prompt to the AI</span>
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width:'100%'}}>
                  <textarea type="text" id="prompt-input" name="prompt-input" style={{width: '80%', height: '50px', borderRadius:18, padding:20, margin:30, fontFamily:'Open Sans', fontSize:15}}/>
                  <button
                    style={{
                      paddingTop: 10,
                      paddingBottom:10,
                      width:130,
                      borderRadius: 12,
                      backgroundColor: buttonBG,
                      color:'white',
                      border:0,
                    }}
                    onMouseEnter={()=>setButtonBG('#3f91fe')}
                    onMouseLeave={()=>setButtonBG('#2f80ed')}
                    onClick={() => {
                      setButtonBG('#1e70dc')
                      // editor, promptTitle, userPrompt, errorCallback, loadingCallback, selection, paymentCallback, serverURL, userID, version
                      callAIPromptWithQuestion(editor, "Prompt", document.getElementById('prompt-input').value, setErrorMessage, setLoadingModalOpen, selection, setPaymentModalOpen, serverURL, userID, version)
                      setPromptModalOpen(false);
                    }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </Modal>

            {/* LOADING AI MODAL */}
            <Modal
              isOpen={loadingModalOpen}
              // onRequestClose={() => setLoadingModalOpen(false)}
              contentLabel="Loading Modal"
              ariaHideApp={false}
              style={{
                overlay: {
                  backgroundColor: 'rgba(0,0,0,0.5)',
                },
                content: {
                  backgroundColor: 'white',
                  width: '50%',
                  height: '30%',
                  margin: 'auto',
                  display: 'flex',
                  borderRadius:18,
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontFamily: 'Open Sans'
                }
              }}
            >
              <Loader/>
              <h3>Loading...</h3>
            </Modal>

            {/* PAYMENT REQUEST MOAL */}
            <Modal
              isOpen={paymentModalOpen}
              onRequestClose={() => {setPaymentModalOpen(false); setError(''); setLoadingModalOpen(false);}}
              contentLabel="Payment Modal"
              ariaHideApp={false}
              style={{
                overlay: {
                  backgroundColor: 'rgba(0,0,0,0.5)',
                },
                content: {
                  backgroundColor: 'white',
                  width: '50%',
                  height: '50%',
                  margin: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }
              }}
            >
              <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                <span style={{fontSize: 20, fontWeight: 'bold'}}>You have exausted your free AI usage</span>
                <span style={{fontSize: 15, fontWeight: 'default'}}>We will refill your free AI usage within a month.</span>
                <span style={{fontSize: 15, fontWeight: 'default'}}>$7.99 / month for unlimitted usage. <br/> Fill in your email adress and we will send you payment details shortly.</span>
                <div>
                  <input type="text" id="payment-input" name="payment-input" placeholder='email@abc.com' style={{width: '80%', height: '50%'}}/>
                  <button
                      onClick={() => {
                        const email = document.getElementById('payment-input').value;
                        if(!email || email.length < 5){
                          setError('Please enter a valid email address.');
                          return;
                        }
                        // TODO: send email to server
                        fetch(serverURL + '/payment-request', {
                          method: 'POST',
                          body: JSON.stringify({
                              userID: userID,
                              email: email,
                          }),
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          mode: 'cors'
                        })
                        .then(response => response.json())
                        .then(data => {
                          if(data.error){
                            setError(data.error);
                          }
                          else{
                            setError('Thank you for your interest! We will contact you shortly.');
                          }
                        });

                      }}
                  >
                    Submit
                  </button>
                  <span style={{fontSize: 15, color:'red'}}>{' ' + error}</span>
                </div>
              </div>
            </Modal>

            {/* ERROR MODAL */}
            <Modal
              isOpen={errorModalOpen}
              onRequestClose={() => {setErrorModalOpen(false); setError(''); setLoadingModalOpen(false);}}
              contentLabel="Error Modal"
              ariaHideApp={false}
              style={{
                overlay: {
                  backgroundColor: 'rgba(0,0,0,0.5)',
                },
                content: {
                  backgroundColor: 'white',
                  width: '50%',
                  height: '50%',
                  margin: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }
              }}
            >
              <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                <span style={{fontSize: 20, fontWeight: 'bold'}}>Error</span>
                <span style={{fontSize: 15, fontWeight: 'default'}}>{error}</span>
              </div>
            </Modal>
            
            <EditorContent 
              editor={editor} 
              onKeyDown={handleKeyDown}
              style={{
                height: '86%',
                width: '98%',
                overflowY: 'auto',
                margin:10,
                position: 'absolute',
                bottom: 0,
                top:'5.5rem',
              }}

              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={handleDragOver}

              onClick={() => {
                editor.commands.focus();
              }}
              
            />

            <MenuBar editor={editor} fileName={fileName}
              setErrorMessage={setErrorMessage}
              setPromptModalOpen={setPromptModalOpen}
              style={{
                height: '10%',
                position: 'absolute',
                top: 0,
              }}
              callprompt={callprompt}
            />
        </>
    )
}