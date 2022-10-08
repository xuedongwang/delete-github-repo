#!/usr/bin/env node
const inquirer = require('inquirer');
const ora = require('ora');
const { Octokit } = require('@octokit/core');
// https://github.com/settings/tokens/new

let octokit = null;

async function getOwer() {
    const res = await octokit.request('GET /user', {});
    return res.data.login;
}

async function deleteRepoByName(repo, owner) {
    try {
        await octokit.request('DELETE /repos/{owner}/{repo}', {
            owner,
            repo
        });
    } catch(err) {
        throw err;
    }
}

function loading(text = 'loading') {
    const spinner = ora();
    spinner.start();
    spinner.color = 'yellow';
    spinner.text = text;
    return spinner;
}

function getRepos() {
    return new Promise((resolve, reject) => {
        octokit.request('GET /user/repos', {})
            .then(res => {
                resolve(res.data.map(item => item.private ? `${item.name}(私有)`: item.name));
            })
            .catch(err => {
                reject(err);
            });
    });
}


let loadingInstance = null;

inquirer
    .prompt([
        {
            message: '请输入你的token(可以在这里创建https://github.com/settings/tokens/new)',
            name: 'token',
            type: 'input',
            validate(token) {
                const done = this.async();
                if (token.trim().length === 0) {
                    done('请至少选择一个仓库');
                    return;
                }
                done(null, true);
            },
        }
    ])
    .then(async (answers) => {
        const token = answers.token;
        octokit = new Octokit({ auth: token });

        loadingInstance = loading('正在获取仓库的ower');
        const owner = await getOwer();
        loadingInstance.succeed('获取仓库ower成功');
    
        loadingInstance = loading('正在获取仓库repos列表');
        const repos = await getRepos();
        if (repos.length === 0) {
            loadingInstance.warn('仓库数量为0，可能有以下原因:\n1.你当前的仓库都没private仓库并且传入的token可能没有勾选repo权限。2.你暂时没有创建仓库。\n可在：https://github.com/settings/tokens/new，重新生成token，请至少勾选 delete_repo 和 repo 两项权限。');
            return;
        }
        loadingInstance.succeed('获取仓库列表\n成功');

        inquirer
            .prompt([
                {
                    message: '请选择需要删除的仓库',
                    name: 'repos',
                    type: 'checkbox',
                    validate(repos) {
                        const done = this.async();
                        if (repos.length === 0) {
                            done('请至少选择一个仓库');
                            return;
                        }
                        done(null, true);
                    },
                    choices: repos
                }
            ])
            .then(async (answers) => {
                for (let i = 0; i < answers.repos.length; i++) {
                    loadingInstance = loading(`正在删除仓库${answers.repos[i]}`);
                    await deleteRepoByName(answers.repos[i], owner);
                    loadingInstance.succeed(`仓库${answers.repos[i]}删除成功`);
                }
            })
            .catch((error) => {
                throw error;
            });
    })
    .catch((error) => {
        if (error.status === 401) {
            // delete_repo  repo
            loadingInstance.fail('传入的token已过期或没权限，请重新生成。\n生成地址为：https://github.com/settings/tokens/new\n请至少勾选 delete_repo 和 repo 两项权限。');
            return;
        }
        throw error;
    });