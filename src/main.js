import _ from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import { Button, Input, Container, Checkbox, Header, Menu, Dropdown, Image,
         Table, Grid, Segment, Dimmer, Popup, Label, Form, Loader } from 'semantic-ui-react';
import { Upload, Icon, Button as AntButton, message } from 'antd';
const Dragger = Upload.Dragger;

const FILE_WORDS = ['file', 'path'];

function argContainsWords(arg, words) {
    var parts = _.split(_.lowerCase(arg), /[ \-_]+/);

    // If any part of the argument contains a word, return true
    var returnVal = false;
    _.each(words, function(word) {
        if (_.includes(parts, word)) {
            returnVal = true;
        }
    });

    return returnVal;
}

class ArgumentComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var innerComponent = null;
        if (typeof(this.props.arg.default) === 'boolean' || this.props.arg.type === 'bool') {
            innerComponent = <Checkbox toggle label={this.props.arg.human_arg} />;
        }
        else if (typeof(this.props.arg.default) === 'number' ||
                 this.props.arg.type === 'float' ||
                 this.props.arg.type == 'int') {
            innerComponent = (
                <Form.Field>
                    <label> {this.props.arg.human_arg}</label>
                    <Input size='small'
                           onChange={(e) => this.props.handleChange(this.props.arg.arg, e)}
                           value={this.props.inputValue} />
                </Form.Field>
            );
        }
        else if (this.props.arg.type === 'file' ||
                 argContainsWords(this.props.arg.arg, FILE_WORDS)) {
            const props = {
                name: 'file',
                action: '//jsonplaceholder.typicode.com/posts/',
                headers: {
                    authorization: 'authorization-text',
                },
                onChange(info) {
                    if (info.file.status === 'done') {
                        message.success(`${info.file.name} uploaded successfully.`);
                    } else if (info.file.status === 'error') {
                        message.error(`${info.file.name} upload failed.`);
                    }
                },
            };

            innerComponent = (
                <Form.Field>
                    <label> {this.props.arg.human_arg}</label>
                    <Upload {...props}>
                        <AntButton>
                            <Icon type='upload' />Upload File
                        </AntButton>
                    </Upload>
                </Form.Field>
            );
        }
        else {
            innerComponent = (
                <Form.Field>
                    <label> {this.props.arg.human_arg}</label>
                    <Input size='small' />
                </Form.Field>
            );
        }

        var component = innerComponent;
        if (!_.isEmpty(this.props.arg.help)) {
            component = <Popup
                            inverted
                            size='mini'
                            trigger={innerComponent}
                            content={this.props.arg.help} />;
        }
        return component;
    }
}

export class InputComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            expanded: true
        };
        this.handleChange = this.handleChange.bind(this);
    }

    /*
    handleSubmit = event => {
        event.preventDefault();

        var fetchOptions = {
            method: 'POST',
            headers,
            body: formData
        };

        axios
            .get(`https://api.github.com/users/${this.state.userName}`)
            .then(resp => {
                this.props.onSubmit(resp.data);
                this.setState({ userName: "" });
            });
    };
     */

    handleChange(arg, event) {
        var obj = {};
        obj[arg] = event.target.value;
        this.setState(obj);
        console.log(this.state);
    }

    componentDidMount() {
        fetch('/wargy/api/v0.0.1/args')
            .then(res => res.json())
            .then(
                (result) => { this.setState({isLoaded: true, args: result.args}); },
                (error) => { this.setState({isLoaded: true, error}); }
            );
    }

    render() {
        const { error, isLoaded, args } = this.state;
        if (error) {
            return <Container><p>Error: {error.message}</p></Container>;
        } else if (!isLoaded) {
            return <Loader active inline='centered'>Loading...</Loader>;
        } else {
            var elements = [];
            var group_names = [];
            var group_elements = {};
            var self = this; // Make accessible in the closure below
            args.map(function(arg_group, i) {
                // Arg group names
                var first_entry = Object.entries(arg_group)[0];
                var group_name = first_entry[0];
                group_names.push(group_name);

                // Arg group contents.
                var group_values = first_entry[1];
                group_elements[group_name] = [];
                group_values.map(function(arg, arg_i) {
                    // The state doesn't have a default for every possible argument,
                    // which results in "Warning: A component is changing an uncontrolled..."
                    // _.defaultTo fixes that.
                    // TODO: use result.args when fetched to populate the state correctly.
                    var inputValue = _.defaultTo(self.state[arg.arg], "");
                    group_elements[group_name].push(
                        <Grid.Column key={arg_i}>
                            <ArgumentComponent arg={arg}
                                               handleChange={self.handleChange}
                                               inputValue={inputValue} />
                        </Grid.Column>
                    );
                });
            });

            group_names.map(function(group_name, i) {
                elements.push(
                    <Segment.Group key={i}>
                        <Segment color='violet'><h2>{group_name}</h2></Segment>
                        <Segment>
                            <Form>
                                <Grid columns={2}>
                                    {group_elements[group_name]}
                                </Grid>
                            </Form>
                        </Segment>
                    </Segment.Group>
                );
            });

            return <Container text>{elements}</Container>;
        }
    }
}
