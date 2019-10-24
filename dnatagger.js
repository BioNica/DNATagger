
function Translation()
{
   this.tableName="1 - Standard Code (default)"
   this.table=transTables[this.tableName]
   
   this.select=function()
   {
      var s=document.getElementById("transTableSelect")
      this.tableName=s.options[s.selectedIndex].value
      this.table=transTables[this.tableName]
      this.showTable()
   }
   
   this.amino=function(codon)
   {
      return this.table[codon]
   }
   
   this.aminoName=function(codon)
   {
      return aliases[this.amino(codon)].amino
   }

   this.aminoAbbr=function(codon)
   {
      return aliases[this.amino(codon)].abbr
   }
   
   this.foreColor=function(codon)
   {
      return color.table[this.amino(codon)].fore
   }

   this.bkgColor=function(codon)
   {
      return color.table[this.amino(codon)].bkg
   }
   
   this.showTable=function()
   {
      var acids=['T','C','A','G']

      var retv=''
      retv='<select id="transTableSelect" onchange="javascript: translation.select();">'
      for (i in transTables)
      {
         retv+='<option'
         if (i==this.tableName)
            retv+=' selected="true"'
         retv+='>'+i+'</option>'
      }
      retv+='</select><br/><br/>'
      
      retv+='<table id="TransTable" border="1" cellpadding="3" cellspacing="0">'
      retv+='<tr><td rowspan="2" colspan="2"></td><th colspan="4">2nd base</th></tr>'
      retv+='<tr><th>T</th><th>C</th><th>A</th><th>G</th></tr>'
      retv+='<tr><th rowspan="4">1st<br />base</th>'
      for(i1 in acids) {
         if (i1!=0)
            retv+='<tr>'
         retv+='<th>'+acids[i1]+'</th>'
         for(i2 in acids) {
            retv+='<td>'
            for(i3 in acids) {
               var codon=acids[i1]+acids[i2]+acids[i3]
               retv+=codon+': '+this.aminoName(codon)
               +' (<span style="background: '+this.bkgColor(codon)
               +"; color: "+this.foreColor(codon)+';">'+
               this.amino(codon)+'</span>)<br/>'
            }
            retv+='</td>'
         }
         retv+='</tr>'
      }
      retv+='</table>'
      document.getElementById('d_trans').innerHTML=retv
   }
}

function Colorizer()
{
   var aminoLetters=''
   for (i in aliases)
   {
      if (i!='*' && i!='~')
         aminoLetters+=i
   }
   var aminoBlockStr='\\b['+aminoLetters+'][\\-'+aminoLetters+']{3,}\\b'

   // aminoBlock: word boundary followed by an aminoacid letter, then
   // at least 3 aminoacid letters or gaps ('-'), followed by a word boundary

   // codonBlock: word boundary followed by a base letter, then
   // a base letter or gap ('-','.'), then at least seven of any base letters,
   // gaps or spaces, followed by a word boundary
   
   this.aminoBlock=RegExp(aminoBlockStr,"gm")
   this.codonBlock=/\b[UTAGCutagc][UTAGCutagc\-\.][UTAGCutagc\-\. ]{7,}\b/gm

   this.styleFromAmino=function(alet,txt)
   {
      return '<span style="color: '+color.table[alet].fore+
         '; background: '+color.table[alet].bkg+';">'+txt+'</span>'
   }

   this.styleFromCodon=function(codon,txt,ini,mid)
   {
      var alet=translation.amino(codon)
      if (txt.length>3) {
         return txt.substring(0,ini)
                +this.styleFromAmino(alet,txt[ini])
                +txt.substring(ini+1,mid)
                +this.styleFromAmino(alet,txt[mid])
                +txt.substring(mid+1,txt.length-1)
                +this.styleFromAmino(alet,txt[txt.length-1])
      } else
         return this.styleFromAmino(alet,txt)
   }

   this.processAminoBlock=function(txt)
   {
      var retv=''
      for (i in txt)
      {
         if (txt[i]=='-')
            retv+=txt[i]
         else
            retv+=this.styleFromAmino(txt[i],txt[i])
      }
      return retv
   }

   this.processCodonBlock=function(txt)
   {
   	var uppertxt=txt.toUpperCase()
      var retv=''
      var ci=0
      var mid,ini
      var codon={}
      var strip=''
      for (i in txt)
      {
         var c=uppertxt[i]
         strip+=txt[i]
         if (c=='T' || c=='A' || c=='G' || c=='C' || c=='U')
         {
            codon[ci]=(c=='U'?'T':c)
            ci++
            if (ci==1)
               ini=strip.length-1
            if (ci==2)
               mid=strip.length-1
            if (ci==3) {
               retv+=this.styleFromCodon(codon[0]+codon[1]+codon[2],strip,ini,mid)
               ci=0
               mid=0
               strip=''
            }
         }
      }
      retv+=strip
      return retv
   }

   this.processAminos=function(txt)
   {
      var lastIdx=0
      var retv=''
      var exeres
      this.aminoBlock.lastIndex=0
      while(1)
      {
         exeres=this.aminoBlock.exec(txt)
         if (!exeres)
            return retv+txt.substring(lastIdx)
         retv+=txt.substring(lastIdx,exeres.index) // block start
         retv+=this.processAminoBlock(
            txt.substring(exeres.index,this.aminoBlock.lastIndex)
         ) // block end
         lastIdx=this.aminoBlock.lastIndex
      }
   }

   this.process=function(txt)
   {
      var lastIdx=0
      var retv=''
      var exeres
      while(1)
      {
         exeres=this.codonBlock.exec(txt)
         if (!exeres)
            return retv+this.processAminos(txt.substring(lastIdx))
         retv+=this.processAminos(txt.substring(lastIdx,exeres.index)) // block start
         retv+=this.processCodonBlock(
            txt.substring(exeres.index,this.codonBlock.lastIndex)
         ) // block end
         lastIdx=this.codonBlock.lastIndex
      }
   }
}


function initialize()
{
   translation=new Translation()
   colorizer=new Colorizer()
   color=new Color()
   menu=new Menu('edit', {
      'edit': function() { },
      'color': function() { },
      'trans': function() { },
      'instructions': function() { },
      'about': function() { },

      'view': function()
      {
         var src=document.getElementById("alignEdit")
         var dest=document.getElementById("viewOutput")
         dest.innerHTML=colorizer.process(src.value)
      },
   })

   translation.showTable()
   color.init()
   menu.select('instructions')
   return false
}

