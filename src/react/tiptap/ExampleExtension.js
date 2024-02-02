import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import React, {useState} from 'react'

export const Component = props => {
  const increase = () => {
    props.updateAttributes({
      count: props.node.attrs.count + 1,
    })
  }

  return (
    <NodeViewWrapper className="react-component">
      <span className="label">React Component</span>

      <div className="content">
        <button onClick={increase}>
          This button has been clicked {props.node.attrs.count} times.
        </button>
      </div>
    </NodeViewWrapper>
  )
}

export default Node.create({
  name: 'reactComponent',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      count: {
        default: 0,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'react-component',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['react-component', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component)
  },

  addCommands() {
    return {
      setReactComponent : attributes => ({ commands, editor }) => {
        const parameter = `${attributes?.count ?? 0}`;
        return commands.insertContent(`<react-component count="${parameter}"></react-component>`)
      }
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-r': () => this.editor.commands.setReactComponent({ count: 0 }),
    }
  }
})