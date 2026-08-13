FROM node:22-bookworm

WORKDIR /workspace

EXPOSE 8081 19000 19001 19002

# O Expo usa este pacote para criar túneis. A instalação acontece durante o
# build, ainda como root, pois o usuário node não pode instalar pacotes globais.
RUN npm install --global @expo/ngrok@^4.1.0

USER node

CMD ["bash"]
