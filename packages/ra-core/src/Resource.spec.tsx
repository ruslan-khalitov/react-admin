import React from 'react';
import expect from 'expect';
import { cleanup, wait } from 'react-testing-library';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { renderWithRedux } from 'ra-test-utils';

import Resource from './Resource';
import { registerResource, unregisterResource } from './actions';
import AuthContext from './auth/AuthContext';

const PostList = () => <div>PostList</div>;
const PostEdit = () => <div>PostEdit</div>;
const PostCreate = () => <div>PostCreate</div>;
const PostShow = () => <div>PostShow</div>;
const PostIcon = () => <div>PostIcon</div>;

const resource = {
    name: 'posts',
    options: { foo: 'bar' },
    list: PostList,
    edit: PostEdit,
    create: PostCreate,
    show: PostShow,
    icon: PostIcon,
};

describe('<Resource>', () => {
    afterEach(cleanup);

    it(`registers its resource in redux on mount when context is 'registration'`, () => {
        const { dispatch } = renderWithRedux(
            <Resource {...resource} intent="registration" />
        );
        expect(dispatch).toHaveBeenCalledWith(
            registerResource({
                name: 'posts',
                options: { foo: 'bar' },
                hasList: true,
                hasEdit: true,
                hasShow: true,
                hasCreate: true,
                icon: PostIcon,
            })
        );
    });
    it(`unregister its resource from redux on unmount when context is 'registration'`, () => {
        const { unmount, dispatch } = renderWithRedux(
            <Resource {...resource} intent="registration" />
        );
        unmount();
        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch.mock.calls[1][0]).toEqual(unregisterResource('posts'));
    });
    it('renders resource routes by default', () => {
        const history = createMemoryHistory();
        const { getByText } = renderWithRedux(
            <Router history={history}>
                <Resource
                    {...resource}
                    match={{
                        url: '/posts',
                        params: {},
                        isExact: true,
                        path: '/',
                    }}
                />
            </Router>,
            { admin: { resources: { posts: {} } } }
        );
        history.push('/posts');
        expect(getByText('PostList')).toBeDefined();
        history.push('/posts/123');
        expect(getByText('PostEdit')).toBeDefined();
        history.push('/posts/123/show');
        expect(getByText('PostShow')).toBeDefined();
        history.push('/posts/create');
        expect(getByText('PostCreate')).toBeDefined();
    });
    it('injects permissions to the resource routes', async () => {
        const history = createMemoryHistory();
        const authProvider = type =>
            type === 'AUTH_GET_PERMISSIONS'
                ? Promise.resolve('admin')
                : Promise.resolve();
        const { getByText } = renderWithRedux(
            <AuthContext.Provider value={authProvider}>
                <Router history={history}>
                    <Resource
                        name="posts"
                        list={({ permissions }) => (
                            <span>Permissions: {permissions}</span>
                        )}
                        match={{
                            url: '/posts',
                            params: {},
                            isExact: true,
                            path: '/',
                        }}
                    />
                </Router>
            </AuthContext.Provider>,
            { admin: { resources: { posts: {} } } }
        );
        history.push('/posts');
        await wait();
        expect(getByText('Permissions: admin')).toBeDefined();
    });
});
