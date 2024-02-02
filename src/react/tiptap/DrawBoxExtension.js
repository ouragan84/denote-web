import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import React, {useState} from 'react'
import ReactDOM from "react-dom";
import DrawBoxComponent from './DrawBoxComponent'


export const DrawBox = props => {

  const updateData = (data) => {
    props.updateAttributes({
      data: data,
    })
  }

  return (
    <NodeViewWrapper className="draw-box">
      <DrawBoxComponent 
        updateData={updateData} 
        initialData={props.node.attrs.data} 
        editorWidth={props.editor.view.dom.parentNode.clientWidth * 0.8}
        editorHeight={props.editor.view.dom.parentNode.clientHeight * 0.8}
      />
    </NodeViewWrapper>
  )

}

const DrawBoxNode = Node.create({
  name: 'draw-box',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      data: {
        default: "default data",
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'draw-box',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['draw-box', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawBox)
  },

  addCommands() {
    return {
      insertDrawBox : attributes => ({ commands, editor }) => {
        const parameters = ""
        if(attributes && attributes.data)
          parameters = `data = "${attributes.data}"`;
          
        return commands.insertContent(`<draw-box ${parameters} ></draw-box>`)
      }
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-d': () => this.editor.commands.insertDrawBox({}),
    }
  }
})

export default DrawBoxNode;