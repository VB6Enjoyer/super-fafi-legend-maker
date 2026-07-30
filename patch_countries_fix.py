with open("src/lib/countries.ts", "r") as f:
    content = f.read()

# Replace interface at the top to be sure
search_interface = """export interface Country {
  name: string;
  code: string;
  flag: string;
}"""

replace_interface = """export interface Country {
  name: string;
  code: string;
  flag: string;
  elo: number;
}"""

content = content.replace(search_interface, replace_interface)

with open("src/lib/countries.ts", "w") as f:
    f.write(content)
