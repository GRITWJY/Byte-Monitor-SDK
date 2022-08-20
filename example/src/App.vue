<template>
  <div>
    <button @click="handleVueError">vue错误</button>
    <button @click="handleJSError">JS错误</button>
    <button @click="handlePromiseError">Promise错误</button>
    <button @click="handleResourceError">资源错误</button>
    <input type="file" id="handleResolve" />

    <br />
    <hr />

    <button @click="handleAjaxSuccess">测试 ajax 请求-成功(axios)</button>
    <button @click="handleAjaxFail">测试 ajax 请求-失败(axios)</button>
    <button @click="handleFetch">测试 fetch 请求</button>

    <div>
      <h1 class="title">hello app</h1>
      <button>按钮</button>
      <ul>
        <li>
          <router-link to="/home">Home</router-link>
        </li>
        <li>
          <router-link to="/about">About</router-link>
        </li>
      </ul>
      <router-view />
    </div>
  </div>
</template>

<script>
import axios from "axios";
import sourceMap from "source-map";

sourceMap.SourceMapConsumer.initialize({
  "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.3/lib/mappings.wasm",
});
export default {
  name: "App",
  mounted() {
    let upload = document.getElementById("handleResolve");
    let _this = this;
    upload.addEventListener("change", function () {
      let file = upload.files[0];
      const reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = async (event) => {
        const look_source = await _this.lookSource(event.target.result, 1, 171);
        console.log(look_source);
      };
    });
  },
  methods: {
    async lookSource(source_map, line, column) {
      try {
        const consumer = await new sourceMap.SourceMapConsumer(source_map);
        const sourcemapData = consumer.originalPositionFor({
          line: line, // 压缩后的行数
          column: column, // 压缩后的列数
        });

        if (!sourcemapData.source) return;

        const sources = consumer.sources;
        // 根据查到的source，到源文件列表中查找索引位置
        const index = sources.indexOf(sourcemapData.source);
        // 到源码列表中查到源代码
        const content = consumer.sourcesContent[index];

        // 将源代码串按"行结束标记"拆分为数组形式
        const rawLines = content.split(/\r?\n/g);

        // 截取报错行前后代码片段，因为数组索引从0开始，故行数需要-1
        let code = [];
        for (
          let i = sourcemapData.line - 10;
          i < sourcemapData.line + 10;
          i++
        ) {
          if (i >= 0) {
            code.push(rawLines[i]);
          }
        }
        // 最后将解析结果和代码片段返回
        console.log(code);
        return { sourcemapData, code: code.join("\n") };
      } catch (e) {
        console.log(e);
        return null;
      }
    },

    handleVueError() {
      let a = {};
      a.toFixed(3);
    },

    handleJSError() {
      setTimeout(() => {
        this.father(); // JS错误
      }, 1000);
    },

    handlePromiseError() {
      new Promise((resolve) => {
        this.father();
        resolve();
      });
    },
    handleResourceError() {
      let script = document.createElement("script");
      script.src = "xx.js";
      document.body.appendChild(script);
    },

    handleAjaxSuccess() {
      axios
        .post("https://junesunray.com/llain/reply/get", {
          a: 3,
        })
        .then(() => {});
    },
    handleAjaxFail() {
      axios.post("https://junesunray.com/llain/reply/et", {}).then(() => {});
    },
    handleFetch() {
      fetch("http://localhost:3000/movies.json")
        .then((response) => response.json())
        .then((data) => console.log(data));
    },
  },
};
</script>

<style>
.title {
  color: pink;
}
</style>
