const { Octokit } = require('@octokit/core');

class API {
    constructor(auth) {
        this.octokit = new Octokit({ auth });
    }

    async getOwer() {
        const res = await this.octokit.request('GET /user', {});
        return res.data.login;
    }

    async deleteRepoByName(repo, owner) {
        await this.octokit.request('DELETE /repos/{owner}/{repo}', {
            owner,
            repo
        });
    }


    async getRepos() {
        const res = await this.octokit.request('GET /user/repos', {});
        return res.data.map(item => item.private ? `${item.name}(私有)`: item.name);
    }
}

module.exports = API;