import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import React, {useRef, useState, useLayoutEffect, useEffect} from 'react'
import { ResizableBox } from 'react-resizable'
import 'react-resizable/css/styles.css';
import { styled } from 'styled-components'

export const MyImageComponent = props => {

  const margin = 64;
  const img_b64 = props.node.attrs.base64;

  const [width, setWidth] = useState(0)
  const [aspectRatio, setAspectRatio] = useState(1)
  const [divWidth, setDivWidth] = useState(props.editor.view.dom.parentNode.clientWidth - margin);


  useEffect(() => {
    const i = new Image();
    i.src = img_b64;

    i.onload = () => {
      if ( props.node.attrs.width && props.node.attrs.width > 0 ){
        setWidth( Math.min(props.node.attrs.width, divWidth) )
      } else {
        setWidth( Math.min(i.width, divWidth) )
      }
      setAspectRatio(i.width/i.height)
    };

    return () => {
      i.onload = null;
      i.src = "";
      setWidth(0)
    };
  }, [])

  useEffect(() => {
    console.log('setting div width: ', props.editor.view.dom.parentNode.clientWidth - margin)
    setDivWidth(props.editor.view.dom.parentNode.clientWidth - margin)
    setWidth( Math.min(width, props.editor.view.dom.parentNode.clientWidth - margin) )
  }, [ props.editor.view.dom.parentNode.clientWidth ])

  return (
    <NodeViewWrapper className="my-image">
      <ResizableBox
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          boxSizing: 'border-box',
          marginBottom: '10px',
          overflow: 'hidden',
          position: 'relative',
          margin: '20px',
        }}
        width={ width }
        height={ width / aspectRatio }
        minConstraints={[50, 50 / aspectRatio]}
        maxConstraints={[divWidth, divWidth / aspectRatio]}
        onResize={(e, data) => {
          console.log('resizing: ', data.size.width, data.size.width / aspectRatio)
          setWidth(data.size.width)
        }}
        onResizeStop={(e, data) => {
          console.log('saving the width: ', data.size.width)
          props.updateAttributes({
            width: data.size.width,
          })
        }}
      >
        <img src={img_b64} width={width} height={width / aspectRatio} />
        {props.selected && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'cyan',

            }}
          />
        )
        }
      </ResizableBox>
    </NodeViewWrapper>
  )
}




const MyImageNode = Node.create({
  name: 'my-image',
  group: 'block',
  atom: true,

    addAttributes() {
        return {
            base64: {
                default: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjmLTnxX8AB1ADNhJq0mgAAAAASUVORK5CYII=",
            },
            width: {
                default: null,
            },
        }
    },

  parseHTML() {
    return [
      {
        tag: 'my-image',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['my-image', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MyImageComponent)
  },

  addCommands() {
    return {
        insertMyImage : attributes => ({ commands, editor }) => {
        let parameters = ""
        if(attributes && attributes.base64)
          parameters += ` base64 = "${attributes.base64}"`;
        if(attributes && attributes.width)
          parameters += ` width = "${attributes.width}"`;
        // if(attributes && attributes.height)
        //   parameters += ` height = "${attributes.height}"`;
          
        return commands.insertContent(`<my-image${parameters}></my-image> `)
      }
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-i': () => this.editor.commands.insertMyImage({}),
    }
  }
})

export default MyImageNode;