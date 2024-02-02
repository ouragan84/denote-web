import React, {useState, useRef, useEffect} from 'react'
import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { EditableMathField, addStyles } from 'react-mathquill'
import markdownitContainer from "markdown-it-container";



addStyles()

export const InlineMathBox = props => {

  const [field, setField] = useState(null);
  const currentField = useRef(field);

  useEffect(() => {
    if (props.selected) {
      currentField.current.focus();
    }
  }, [props.selected]);

  useEffect(() => {
    const prevMathField = currentField.current;
    currentField.current = field;

    if (!prevMathField && field && props.node.attrs.isNew) {
      props.updateAttributes({
        isNew: false,
      })
      field.focus();
    }
  }, [field]);

  const handleChange = (mathField) => {
    setField(mathField);
    props.updateAttributes({
      latex: mathField.latex(),
    })

    console.log(mathField.latex())

    props.editor.commands.save();
  }

  const handleKeyDown = (e) => {
      const { key } = e;
      const pos = props.getPos();

      if (key === 'Tab'){
        e.preventDefault();
        e.stopPropagation();
        props.editor.chain().focus(pos+1).run();
      }
  }

  return (
      <NodeViewWrapper
          className="inline-math-box"
          contentEditable={false}
      >
          <EditableMathField
              contentEditable={false}
              latex={props.node.attrs.latex}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              style={{
                border: 'none',
                // outline if latex is empty or has only spaces (in latex, spaces are represented by '\ ')
                outline: props.node.attrs.latex.replace(/\\ /g,'') === '' ? '1px solid #ddd' : 'none', 
              }}
              mathquillDidMount={mathField => {
                setField(mathField);
              }}
              // https://docs.mathquill.com/en/latest/Config/
              config={{
                autoCommands: 'pi theta sqrt sum',
                autoOperatorNames: 'sin cos',
                handlers: {
                  // edit: (mathField) => { props.editor.commands.save() },
                  upOutOf: (mathField) => { props.editor.chain().focus(props.getPos()-1).run(); },
                  downOutOf: (mathField) => { props.editor.chain().focus(props.getPos()+1).run(); },
                  moveOutOf: (dir, mathField) => { props.editor.chain().focus(props.getPos()+dir).run();},
                  // this one sometimes gives an error but it works, so.... ig it's fine
                  deleteOutOf: (dir, mathField) => { props.editor.chain().focus(props.getPos() + 1).deleteRange({from: props.getPos(), to: props.getPos() + 1}).run(); },
                }
              }}
          >
          </EditableMathField>
      </NodeViewWrapper>
  )
}


const InlineMathBoxNode = Node.create({
    name: "inline-math-box",
    group: "inline",
    inline: true,
    selectable: true,
    atom: false,
    selectable: true,

    addAttributes() {
        return {
          latex: {
            default: "",
            renderHTML: (attributes) => {
              return {
                latex: attributes.latex
              };
            }
          },
          isNew: {
            default: true,
          }
        };
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes), 0];
    },

    addStorage() {
      return {
        markdown: {
          parse: (markdown) => {
            const regex = /<span data-type="inline-math-box" latex="(.*?)"><\/span>/g;
            let newMarkdown = markdown;
            let match;
            while ((match = regex.exec(markdown))) {
              const latex = match[1];
              const mathbox = `<span data-type="inline-math-box" latex="${latex}"></span>`;
              newMarkdown = newMarkdown.replace(match[0], `$$${latex}$$`);
            }
            return newMarkdown;
          },
          render: ({ node }) => {
            const latex = node.attrs.latex;
            return `<span data-type="inline-math-box" latex="${latex}"></span>`;
          }
        }
      };
    },
    

    parseHTML() {
        return [
          {
            tag: `span[data-type="${this.name}"]`
          }
        ];
      },
    
      renderHTML({ node, HTMLAttributes }) {
        return [
          "span",
          mergeAttributes(
            { "data-type": this.name },
            this.options.HTMLAttributes,
            HTMLAttributes
          )
        ];
      },

    addNodeView() {
        // return ReactNodeViewRenderer(InlineMathBox, { isNew: true });
        return ReactNodeViewRenderer((props) => {
          return <InlineMathBox {...props}/>;
        }, {});
    },

    addCommands() {
        return {
            insertInlineMathBox: (attrs) => ({ tr, commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs
                });
            }
        }
    },

    addKeyboardShortcuts() {
        return {
            "Mod-m": () => this.editor.commands.insertInlineMathBox(),
        }
    },
})

export default InlineMathBoxNode;
