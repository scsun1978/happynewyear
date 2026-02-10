package config

import (
	"os"

	"gopkg.in/yaml.v2"
)

type Config struct {
	Name string `yaml:"Name"`
	Host string `yaml:"Host"`
	Port int    `yaml:"Port"`
	Log  struct {
		Mode string `yaml:"Mode"`
		Path string `yaml:"Path"`
		Level string `yaml:"Level"`
	} `yaml:"Log"`
	Database struct {
		DataSource string `yaml:"DataSource"`
	} `yaml:"Database"`
	Redis struct {
		Host string `yaml:"Host"`
		Type string `yaml:"Type"`
	} `yaml:"Redis"`
	WeCom struct {
		CorpID  string `yaml:"CorpID"`
		AgentID int    `yaml:"AgentID"`
		Secret  string `yaml:"Secret"`
	} `yaml:"WeCom"`
	Game struct {
		AppSecret          string `yaml:"AppSecret"`
		AdminPassword      string `yaml:"AdminPassword"`
		ScoreToChanceRatio int    `yaml:"ScoreToChanceRatio"`
		MaxChancesPerDay   int    `yaml:"MaxChancesPerDay"`
	} `yaml:"Game"`
}

func Load(path string) (Config, error) {
	var c Config
	bytes, err := os.ReadFile(path)
	if err != nil {
		return c, err
	}
	err = yaml.Unmarshal(bytes, &c)
	if err != nil {
		return c, err
	}

	// Override Secret from Environment Variable
	if secret := os.Getenv("WEWORK_SECRET"); secret != "" {
		c.WeCom.Secret = secret
	}
	if ds := os.Getenv("DB_DATASOURCE"); ds != "" {
		c.Database.DataSource = ds
	}
	if appSecret := os.Getenv("APP_SECRET"); appSecret != "" {
		c.Game.AppSecret = appSecret
	}
	if adminPwd := os.Getenv("ADMIN_PASSWORD"); adminPwd != "" {
		c.Game.AdminPassword = adminPwd
	}

	return c, nil
}
