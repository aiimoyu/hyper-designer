## TODO

- [ ] HArchitect 在第一次对话 cur stage 是 null 的情况下，不应该先要求澄清需求，而是先进入HCollect阶段收集完文档后，进入 IR stage 才开始要求用户澄清需求
- [ ] 现在的问题是先用户说进入下一阶段，再进入critic，应该在智能体生成了文档，永远马上进入critic阶段。请审视HArchitect、HEngineer的系统提示词和src/workflow/prompts每个stage的提示词
- [ ] critic 不能修改文档，只能返回建议。HArchitect、HEngineer收到建议后要自己修改文档再提交critic进入循环直到critic说通过
- [ ] hook 根据阶段自动纠正agent